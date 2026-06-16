import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { AddAdminDto } from './dto/addAdmin.dto';
import { RemoveAdminDto } from './dto/removeAdmin.dto';

@Injectable()
export class EventMemberService {
  constructor(private readonly prisma: PrismaService) {}
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
