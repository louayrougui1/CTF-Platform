import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
@Injectable()
export class TeamService {
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
}
