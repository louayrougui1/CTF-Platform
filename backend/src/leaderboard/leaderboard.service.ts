import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';

@Injectable()
export class LeaderboardService {
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

  private async assertEventMember(eventId: string, userId: string) {
    const member = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!member)
      throw new ForbiddenException('You are not a member of this event');
    return member;
  }
  async getEventLeaderboard(eventId: string, userId: string) {
    await this.findEventOrThrow(eventId);
    await this.assertEventMember(eventId, userId);

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
}
