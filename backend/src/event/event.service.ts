import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/eventCreate.dto';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { AddAdminDto } from './dto/addAdmin.dto';
import { RemoveAdminDto } from './dto/removeAdmin.dto';

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

  async getEventMembers(eventId: string) {
    await this.findEventOrThrow(eventId);

    return this.prisma.eventMember.findMany({
      where: { eventId },
      select: {
        role: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getEventLeaderboard(eventId: string) {
    await this.findEventOrThrow(eventId);

    const teams = await this.prisma.team.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        members: {
          select: {
            user: {
              select: {
                submissions: {
                  where: {
                    status: 'CORRECT',
                    challenge: { eventId },
                  },
                  select: {
                    createdAt: true,
                    challenge: { select: { points: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return teams
      .map((team) => {
        const allSubmissions = team.members.flatMap((m) => m.user.submissions);

        const score = allSubmissions.reduce(
          (sum, s) => sum + s.challenge.points,
          0,
        );

        const earliestCorrect =
          allSubmissions.length > 0
            ? Math.min(...allSubmissions.map((s) => s.createdAt.getTime()))
            : Infinity;

        return { teamId: team.id, teamName: team.name, score, earliestCorrect };
      })
      .sort((a, b) =>
        b.score !== a.score
          ? b.score - a.score
          : a.earliestCorrect - b.earliestCorrect,
      )
      .map(({ teamId, teamName, score }) => ({ teamId, teamName, score }));
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

  async getEventTeams(eventId: string) {
    await this.findEventOrThrow(eventId);

    return this.prisma.team.findMany({
      where: { eventId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    });
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

  // ─── ADMIN ROLE MANAGEMENT ──────────────────────────────────────────────────

  async addEventAdmin(user: any, dto: AddAdminDto) {
    await this.assertEventOwner(dto.eventId, user.id);

    if (dto.userIdToPromote === user.id) {
      throw new BadRequestException('Event owner cannot be assigned as admin');
    }

    const member = await this.prisma.eventMember.findUnique({
      where: {
        userId_eventId: {
          userId: dto.userIdToPromote,
          eventId: dto.eventId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User is not an event member');
    }

    return this.prisma.eventMember.update({
      where: {
        userId_eventId: {
          userId: dto.userIdToPromote,
          eventId: dto.eventId,
        },
      },
      data: { role: 'ADMIN' },
    });
  }

  async removeEventAdmin(user: any, dto: RemoveAdminDto) {
    await this.assertEventOwner(dto.eventId, user.id);

    const member = await this.prisma.eventMember.findUnique({
      where: {
        userId_eventId: {
          userId: dto.userIdToRemove,
          eventId: dto.eventId,
        },
      },
    });

    if (!member) {
      throw new NotFoundException('User is not an event member');
    }

    if (member.role !== 'ADMIN') {
      throw new BadRequestException('User is not an admin of this event');
    }

    return this.prisma.eventMember.update({
      where: {
        userId_eventId: {
          userId: dto.userIdToRemove,
          eventId: dto.eventId,
        },
      },
      data: { role: 'MEMBER' },
    });
  }

  // ─── MEMBERSHIP ─────────────────────────────────────────────────────────────

  async joinEvent(user: any, eventId: string) {
    const event = await this.findEventOrThrow(eventId);

    if (event.endDate && event.endDate < new Date()) {
      throw new BadRequestException(
        'Cannot join an event that has already ended',
      );
    }

    const member = await this.prisma.eventMember.findUnique({
      where: {
        userId_eventId: { userId: user.id, eventId },
      },
    });

    if (member) {
      throw new BadRequestException('User is already a member of this event');
    }

    return this.prisma.eventMember.create({
      data: {
        userId: user.id,
        eventId,
        role: 'MEMBER',
      },
    });
  }

  async leaveEvent(user: any, eventId: string) {
    const event = await this.findEventOrThrow(eventId);

    if (event.ownerId === user.id) {
      throw new BadRequestException('Event owner cannot leave the event');
    }

    const member = await this.prisma.eventMember.findUnique({
      where: {
        userId_eventId: { userId: user.id, eventId },
      },
    });

    if (!member) {
      throw new BadRequestException('User is not a member of this event');
    }

    return this.prisma.eventMember.delete({
      where: {
        userId_eventId: { userId: user.id, eventId },
      },
    });
  }
}
