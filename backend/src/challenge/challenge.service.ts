import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CreateChallengeDto } from './dto/challengeCreate.dto';
import { UpdateChallengeDto } from './dto/updateChallenge.dto';
import { SubmitFlagDto } from './dto/submitFlag.dto';
import { StorageService } from '../storage/storage.service';

// Public-facing select — never expose the `flag` field here.
const CHALLENGE_SELECT = {
  id: true,
  title: true,
  description: true,
  points: true,
  category: true,
  difficulty: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
  hasFile: true,
  fileUrl: true,
} as const;

const NOT_STARTED_MESSAGE =
  'Challenges will be available when the event starts.';

@Injectable()
export class ChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

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

  /**
   * Throws NotFoundException if the user is not a member of the event.
   * Uses NotFound (not Forbidden) so non-members can't distinguish
   * "doesn't exist" from "exists but you're not in it".
   */
  private async assertEventMember(eventId: string, userId: string) {
    const membership = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!membership) {
      throw new NotFoundException('Event not found');
    }

    return membership;
  }

  /** Returns true once the event's startDate has passed (or has none set). */
  private async hasEventStarted(eventId: string): Promise<boolean> {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { startDate: true },
    });

    return !event.startDate || event.startDate <= new Date();
  }

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  async getChallengesByEvent(user: any, eventId: string) {
    await this.assertEventMember(eventId, user.id);

    if (!(await this.hasEventStarted(eventId))) {
      throw new BadRequestException(NOT_STARTED_MESSAGE);
    }

    const challenges = await this.prisma.challenge.findMany({
      where: { eventId },
      select: CHALLENGE_SELECT,
    });

    return Promise.all(
      challenges.map(async (c) => {
        if (c.hasFile && c.fileUrl) {
          c.fileUrl = await this.storageService.getSignedUrl(c.fileUrl);
        }
        return c;
      }),
    );
  }

  async getChallenge(user: any, id: string) {
    const challenge = await this.findChallengeOrThrow(id);

    await this.assertEventMember(challenge.eventId, user.id);

    if (!(await this.hasEventStarted(challenge.eventId))) {
      throw new BadRequestException(NOT_STARTED_MESSAGE);
    }

    const { flag, ...challengeData } = challenge;
    if (challengeData.hasFile && challengeData.fileUrl) {
      // challenge.fileUrl currently holds the PATH — convert to a live signed URL
      challengeData.fileUrl = await this.storageService.getSignedUrl(
        challengeData.fileUrl,
      );
    }

    return challengeData;
  }

  async getChallengeStats(user: any, challengeId: string) {
    const challenge = await this.findChallengeOrThrow(challengeId);

    await this.assertEventMember(challenge.eventId, user.id);

    if (!(await this.hasEventStarted(challenge.eventId))) {
      throw new BadRequestException(NOT_STARTED_MESSAGE);
    }

    const solveCount = await this.prisma.submission.count({
      where: { challengeId, status: 'CORRECT' },
    });
    return { solveCount };
  }

  // ─── MUTATIONS ──────────────────────────────────────────────────────────────

  async createChallenge(
    user: any,
    eventId: string,
    dto: CreateChallengeDto,
    file?: Express.Multer.File,
  ) {
    await this.assertEventOwnerOrAdmin(eventId, user.id);
    let fileUrl: string | undefined;
    if (file) {
      const { path } = await this.storageService.upload(file);
      fileUrl = path; // storing the storage PATH, not a signed URL — see note below
    }
    return this.prisma.challenge.create({
      data: {
        ...dto,
        eventId,
        hasFile: !!file,
        fileUrl,
      },
      select: CHALLENGE_SELECT,
    });
  }

  async updateChallenge(
    user: any,
    id: string,
    dto: UpdateChallengeDto,
    file?: Express.Multer.File,
  ) {
    const challenge = await this.findChallengeOrThrow(id);

    await this.assertEventOwnerOrAdmin(challenge.eventId, user.id);

    const data: Prisma.ChallengeUpdateInput = { ...dto };

    if (file) {
      const { path } = await this.storageService.upload(file);
      data.hasFile = true;
      data.fileUrl = path;

      // Replace the previously stored file, if any, to avoid orphaned objects
      if (challenge.hasFile && challenge.fileUrl) {
        await this.storageService.delete(challenge.fileUrl);
      }
    }

    return this.prisma.challenge.update({
      where: { id },
      data,
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

    await this.assertEventMember(challenge.eventId, user.id);

    if (!(await this.hasEventStarted(challenge.eventId))) {
      throw new BadRequestException(NOT_STARTED_MESSAGE);
    }

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
