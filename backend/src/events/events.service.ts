import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/eventCreate.dto';
import {
  NotFoundException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateEventDto } from './dto/updateEvent.dto';
import { AddAdminDto } from './dto/addAdmin.dto';
@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}
  async getActiveEvents() {
    const now = new Date();

    return this.prisma.event.findMany({
      where: {
        OR: [
          {
            endDate: {
              gt: now,
            },
          },
          {
            endDate: null,
          },
        ],
      },
      orderBy: {
        startDate: 'asc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getMyEvents(user: any) {
    return this.prisma.event.findMany({
      where: {
        ownerId: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getEvent(id: string) {
    return this.prisma.event.findUniqueOrThrow({
      where: { id: id },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
  async createEvent(user: any, dto: CreateEventDto) {
    const event = await this.prisma.event.create({
      data: {
        ...dto,
        ownerId: user.id,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
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

  async addEventAdmin(user: any, dto: AddAdminDto) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
      select: { ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.ownerId !== user.ownerId) {
      throw new ForbiddenException('Only event owner can assign admins');
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
      data: {
        role: 'ADMIN',
      },
    });
  }

  async updateEvent(userId: string, id: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id },
      select: { ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.event.update({
      where: { id },
      data: dto,
    });
  }

  async deleteEvent(user: any, id: string) {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id },
      select: { ownerId: true },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }
    if (event.ownerId !== user.id) {
      throw new ForbiddenException('You are not allowed to delete this event');
    }

    return this.prisma.event.delete({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        startDate: true,
        endDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async joinEvent(userId: string, eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.eventMember.create({
      data: {
        userId,
        eventId,
        role: 'MEMBER',
      },
    });
  }

  async leaveEvent(userId: string, eventId: string) {
    return this.prisma.eventMember.delete({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });
  }

  async getEventTeams(eventId: string) {
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
}
