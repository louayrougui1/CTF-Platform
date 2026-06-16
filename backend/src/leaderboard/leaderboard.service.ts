import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
@Injectable()
@UseGuards(JwtGuard)
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
}
