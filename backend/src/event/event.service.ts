import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/eventCreate.dto';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { UpdateEventDto } from './dto/updateEvent.dto';

const EVENT_SELECT = {
  id: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class EventService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private async findEventOrThrow(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  private async assertEventOwner(eventId: string, userId: string) {
    const event = await this.findEventOrThrow(eventId);

    if (event.ownerId !== userId) {
      throw new ForbiddenException(
        'Only the event owner can perform this action',
      );
    }

    return event;
  }

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  async getActiveEvents() {
    const now = new Date();

    return this.prisma.event.findMany({
      where: {
        OR: [{ endDate: { gt: now } }, { endDate: null }],
      },
      orderBy: { startDate: 'asc' },
      select: EVENT_SELECT,
    });
  }

  async getMyEvents(user: any) {
    return this.prisma.event.findMany({
      where: { ownerId: user.id },
      select: EVENT_SELECT,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEvent(id: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id },
      select: EVENT_SELECT,
    });
  }

  async getEventStats(eventId: string) {
    await this.findEventOrThrow(eventId);

    const [memberCount, teamCount, challengeCount, solveCount] =
      await Promise.all([
        this.prisma.eventMember.count({ where: { eventId } }),
        this.prisma.team.count({ where: { eventId } }),
        this.prisma.challenge.count({ where: { eventId } }),
        this.prisma.submission.count({
          where: { challenge: { eventId }, status: 'CORRECT' },
        }),
      ]);

    return { memberCount, teamCount, challengeCount, solveCount };
  }

  // ─── MUTATIONS ──────────────────────────────────────────────────────────────

  async createEvent(user: any, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        ownerId: user.id,
      },
      select: EVENT_SELECT,
    });

    await this.prisma.eventMember.create({
      data: {
        userId: user.id,
        eventId: event.id,
        role: 'OWNER',
      },
    });

    return event;
  }

  async updateEvent(user: any, id: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({
      where: { id },
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

    const isOwner = event.ownerId === user.id;
    const isAdmin = event.members.some(
      (m) => m.userId === user.id && m.role === 'ADMIN',
    );

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('You are not allowed to update this event');
    }

    return this.prisma.event.update({
      where: { id },
      data: dto,
      select: EVENT_SELECT,
    });
  }

  async deleteEvent(user: any, id: string) {
    await this.assertEventOwner(id, user.id);

    return this.prisma.event.delete({
      where: { id },
      select: EVENT_SELECT,
    });
  }
}
