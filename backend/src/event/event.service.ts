import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/eventCreate.dto';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { UpdateEventDto } from './dto/updateEvent.dto';

const EVENT_SELECT = {
  id: true,
  title: true,
  description: true,
  startDate: true,
  endDate: true,
  isPublic: true,
  createdAt: true,
  updatedAt: true,
} as const;

// Member/owner contexts may need the invite code to share it; the public
// browse list (getActiveEvents) intentionally keeps using EVENT_SELECT so
// codes are never exposed there.
const EVENT_SELECT_WITH_CODE = {
  ...EVENT_SELECT,
  inviteCode: true,
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

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  async getActiveEvents() {
    const now = new Date();

    return this.prisma.event.findMany({
      where: {
        isPublic: true,
        OR: [{ endDate: { gt: now } }, { endDate: null }],
      },
      orderBy: { startDate: 'asc' },
      select: EVENT_SELECT,
    });
  }

  async getMyEvents(user: any) {
    return this.prisma.event.findMany({
      where: { ownerId: user.id },
      select: EVENT_SELECT_WITH_CODE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getJoinedEvents(user: any) {
    return this.prisma.event.findMany({
      where: { members: { some: { userId: user.id } } },
      select: EVENT_SELECT_WITH_CODE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getEvent(user: any, id: string) {
    const membership = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId: user.id, eventId: id } },
    });

    if (!membership) {
      // Don't leak whether the event exists to non-members
      throw new NotFoundException('Event not found');
    }

    return this.prisma.event.findUniqueOrThrow({
      where: { id },
      select: EVENT_SELECT_WITH_CODE,
    });
  }

  async getEventStats(user: any, eventId: string) {
    const membership = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId: user.id, eventId } },
    });

    if (!membership) {
      throw new NotFoundException('Event not found');
    }

    const [memberCount, teamCount, challengeCount, solveCount] =
      await Promise.all([
        this.prisma.eventMember.count({ where: { eventId } }),
        this.prisma.team.count({ where: { eventId } }),
        this.prisma.challenge.count({ where: { eventId } }),
        this.prisma.submission.count({
          where: { challenge: { eventId } },
        }),
      ]);

    return { memberCount, teamCount, challengeCount, solveCount };
  }
  // ─── MUTATIONS ──────────────────────────────────────────────────────────────

  async createEvent(user: any, dto: CreateEventDto) {
    let event;
    try {
      event = await this.prisma.event.create({
        data: {
          ...dto,
          ownerId: user.id,
          inviteCode: this.generateInviteCode(),
        },
        select: EVENT_SELECT_WITH_CODE,
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        // inviteCode collision — retry once with a fresh code
        event = await this.prisma.event.create({
          data: {
            ...dto,
            ownerId: user.id,
            inviteCode: this.generateInviteCode(),
          },
          select: EVENT_SELECT_WITH_CODE,
        });
      } else {
        throw err;
      }
    }

    try {
      await this.prisma.eventMember.create({
        data: {
          userId: user.id,
          eventId: event.id,
          role: 'OWNER',
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException('User is already a member of this event');
      }
      throw err;
    }

    return event;
  }

  async regenerateInviteCode(user: any, id: string) {
    await this.assertEventOwner(id, user.id);

    return this.prisma.event.update({
      where: { id },
      data: { inviteCode: this.generateInviteCode() },
      select: EVENT_SELECT_WITH_CODE,
    });
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
      select: EVENT_SELECT_WITH_CODE,
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
