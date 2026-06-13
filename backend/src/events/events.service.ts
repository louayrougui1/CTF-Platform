import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/eventCreate.dto';
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

  async getEvent(id) {
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
    return this.prisma.event.create({
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
  }
}
