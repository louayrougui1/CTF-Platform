import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { CreateChallengeDto } from './dto/challengeCreate.dto';
import { UpdateChallengeDto } from './dto/updateChallenge.dto';
import { SubmitFlagDto } from './dto/submitFlag.dto';

// Public-facing select — never expose the `flag` field here.
const CHALLENGE_SELECT = {
  id: true,
  title: true,
  description: true,
  points: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class ChallengeService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private async findChallengeOrThrow(challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    return challenge;
  }

  private async assertEventOwnerOrAdmin(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        ownerId: true,
        members: {
          where: { role: { in: ['OWNER', 'ADMIN'] } },
          select: { userId: true, role: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    const isOwner = event.ownerId === userId;
    const isAdmin = event.members.some(
      (m) => m.userId === userId && m.role === 'ADMIN',
    );

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        'You are not allowed to manage challenges for this event',
      );
    }

    return event;
  }

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  async getChallengesByEvent(eventId: string) {
    return this.prisma.challenge.findMany({
      where: { eventId },
      select: CHALLENGE_SELECT,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getChallenge(id: string) {
    const challenge = await this.findChallengeOrThrow(id);
    const { flag, ...challengeData } = challenge;

    return challengeData;
  }

  async getChallengeStats(challengeId: string) {
    await this.findChallengeOrThrow(challengeId);

    const [submissionCount, solveCount] = await Promise.all([
      this.prisma.submission.count({ where: { challengeId } }),
      this.prisma.submission.count({
        where: { challengeId, status: 'CORRECT' },
      }),
    ]);

    return { submissionCount, solveCount };
  }

  // ─── MUTATIONS ──────────────────────────────────────────────────────────────

  async createChallenge(user: any, eventId: string, dto: CreateChallengeDto) {
    await this.assertEventOwnerOrAdmin(eventId, user.id);

    return this.prisma.challenge.create({
      data: {
        ...dto,
        eventId,
      },
      select: CHALLENGE_SELECT,
    });
  }

  async updateChallenge(user: any, id: string, dto: UpdateChallengeDto) {
    const challenge = await this.findChallengeOrThrow(id);

    await this.assertEventOwnerOrAdmin(challenge.eventId, user.id);

    return this.prisma.challenge.update({
      where: { id },
      data: dto,
      select: CHALLENGE_SELECT,
    });
  }

  async deleteChallenge(user: any, id: string) {
    const challenge = await this.findChallengeOrThrow(id);

    await this.assertEventOwnerOrAdmin(challenge.eventId, user.id);

    return this.prisma.challenge.delete({
      where: { id },
      select: CHALLENGE_SELECT,
    });
  }

  async submitFlag(user: any, challengeId: string, dto: SubmitFlagDto) {
    const challenge = await this.findChallengeOrThrow(challengeId);

    // If the user already solved this challenge, don't let them re-submit for points.
    const alreadySolved = await this.prisma.submission.findFirst({
      where: {
        userId: user.id,
        challengeId,
        status: 'CORRECT',
      },
    });

    if (alreadySolved) {
      throw new BadRequestException('You have already solved this challenge');
    }

    const isCorrect = dto.flag.trim() === challenge.flag.trim();

    const submission = await this.prisma.submission.create({
      data: {
        flag: dto.flag,
        status: isCorrect ? 'CORRECT' : 'WRONG',
        userId: user.id,
        challengeId,
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
    });

    return submission;
  }
}
