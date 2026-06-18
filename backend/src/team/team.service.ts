import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { CreateTeamDto } from './dto/createTeam.dto';

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async findEventOrThrow(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  private async assertEventOwner(eventId: string, userId: string) {
    const event = await this.findEventOrThrow(eventId);
    if (event.ownerId !== userId)
      throw new ForbiddenException(
        'Only the event owner can perform this action',
      );
    return event;
  }

  /** Returns the team or throws. Optionally loads members. */
  private async findTeamOrThrow(teamId: string, includeMembers = false) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: includeMembers },
    });
    if (!team) throw new NotFoundException('Team not found');
    return team;
  }

  /** Ensures userId is a member of the event. */
  private async assertEventMember(eventId: string, userId: string) {
    const member = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!member)
      throw new ForbiddenException('You are not a member of this event');
    return member;
  }

  // ─── Existing Methods ──────────────────────────────────────────────────────

  // async getEventStats(eventId: string) {
  //   await this.findEventOrThrow(eventId);

  //   const [memberCount, teamCount, challengeCount, solveCount] =
  //     await Promise.all([
  //       this.prisma.eventMember.count({ where: { eventId } }),
  //       this.prisma.team.count({ where: { eventId } }),
  //       this.prisma.challenge.count({ where: { eventId } }),
  //       this.prisma.submission.count({
  //         where: { challenge: { eventId }, status: 'CORRECT' },
  //       }),
  //     ]);

  //   return { memberCount, teamCount, challengeCount, solveCount };
  // }

  async getEventTeams(eventId: string) {
    await this.findEventOrThrow(eventId);

    return this.prisma.team.findMany({
      where: { eventId },
      select: { id: true, name: true, createdAt: true, updatedAt: true },
    });
  }

  // ─── New Methods ───────────────────────────────────────────────────────────

  /**
   * Creates a team with a unique name within the event.
   * The creator automatically becomes the team CAPTAIN.
   * Requires the creator to be an event member and not already on a team.
   */
  async createTeam(
    eventId: string,
    userId: string,
    { name, teamPassword }: CreateTeamDto,
  ) {
    await this.findEventOrThrow(eventId);
    await this.assertEventMember(eventId, userId);

    // Block if user is already on any team in this event
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: { userId, team: { eventId } },
    });
    if (existingMembership)
      throw new ConflictException(
        'You are already a member of a team in this event',
      );

    // Enforce unique team name per event
    const nameConflict = await this.prisma.team.findFirst({
      where: { eventId, name },
    });
    if (nameConflict)
      throw new ConflictException(
        `A team named with the same name already exists in this event`,
      );

    return this.prisma.team.create({
      data: {
        name,
        teamPassword,
        eventId,
        members: {
          create: { userId, role: 'CAPTAIN' },
        },
      },
      select: {
        id: true,
        name: true,
        eventId: true,
        createdAt: true,
        members: {
          select: { userId: true, role: true },
        },
      },
    });
  }

  async joinTeam(
    eventId: string,
    teamId: string,
    password: string,
    userId: string,
  ) {
    await this.findEventOrThrow(eventId);
    await this.assertEventMember(eventId, userId);

    const team = await this.findTeamOrThrow(teamId);

    if (team.eventId !== eventId)
      throw new BadRequestException('Team does not belong to this event');

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: { userId, team: { eventId } },
    });
    if (existingMembership)
      throw new ConflictException(
        'You are already a member of a team in this event',
      );

    if (team.teamPassword !== password)
      throw new ForbiddenException('Incorrect team password');

    return this.prisma.teamMember.create({
      data: { userId, teamId, role: 'MEMBER' },
      select: {
        id: true,
        role: true,
        teamId: true,
        userId: true,
        createdAt: true,
      },
    });
  }

  async leaveTeam(teamId: string, userId: string) {
    const team = await this.findTeamOrThrow(teamId, true);

    const membership = (team as any).members.find(
      (m: any) => m.userId === userId,
    );
    if (!membership)
      throw new ForbiddenException('You are not a member of this team');

    if (membership.role === 'CAPTAIN')
      throw new ForbiddenException(
        'Captains cannot leave the team, delete it instead',
      );

    await this.prisma.teamMember.delete({
      where: { userId_teamId: { userId, teamId } },
    });

    return { message: 'Left the team successfully' };
  }

  async deleteTeam(teamId: string, userId: string) {
    const team = await this.findTeamOrThrow(teamId, true);

    const membership = (team as any).members.find(
      (m: any) => m.userId === userId,
    );

    if (!membership)
      throw new ForbiddenException('You are not a member of this team');

    if (membership.role !== 'CAPTAIN')
      throw new ForbiddenException('Only the team captain can delete the team');

    await this.prisma.team.delete({ where: { id: teamId } });

    return { message: 'Team deleted successfully' };
  }

  async getTeamDetails(eventId: string, userId: string) {
    await this.findEventOrThrow(eventId);
    const membership = await this.prisma.teamMember.findFirst({
      where: { userId, team: { eventId } },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, username: true, email: true },
                },
              },
            },
          },
        },
      },
    });

    if (!membership)
      throw new NotFoundException('You are not part of any team in this event');

    return {
      id: membership.team.id,
      name: membership.team.name,
      members: membership.team.members.map((m) => ({
        userId: m.user.id,
        username: m.user.username,
        email: m.user.email,
        role: m.role,
        joinedAt: m.createdAt,
      })),
    };
  }
}
