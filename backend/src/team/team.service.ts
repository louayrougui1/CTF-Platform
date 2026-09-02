import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { CreateTeamDto } from "./dto/createTeam.dto";
import { UpdateTeamDto } from "./dto/updateTeam.dto";

const NOT_STARTED_MESSAGE =
  "Challenges will be available when the event startsssssss.";

const ENDED_MESSAGE = "Event has ended.";

@Injectable()
export class TeamService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Private Helpers ───────────────────────────────────────────────────────

  private async findEventOrThrow(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event) throw new NotFoundException("Event not found");
    return event;
  }

  private async assertEventOwner(eventId: string, userId: string) {
    const event = await this.findEventOrThrow(eventId);
    if (event.ownerId !== userId)
      throw new ForbiddenException(
        "Only the event owner can perform this action",
      );
    return event;
  }

  /** Returns the team or throws. Optionally loads members. */
  private async findTeamOrThrow(teamId: string, includeMembers = false) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { members: includeMembers },
    });
    if (!team) throw new NotFoundException("Team not found");
    return team;
  }

  private async findTeamWithName(
    teamName: string,
    eventId: string,
    includeMembers = false,
  ) {
    const team = await this.prisma.team.findFirst({
      where: {
        name: teamName,
        eventId: eventId,
      },
      include: { members: includeMembers },
    });
    if (!team) throw new NotFoundException("Team not found");
    return team;
  }

  /** Ensures userId is a member of the event. */
  private async assertEventMember(eventId: string, userId: string) {
    const member = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!member)
      throw new ForbiddenException("You are not a member of this event");
    return member;
  }

  private async assertTeamCaptain(teamId: string, userId: string) {
    const team = await this.findTeamOrThrow(teamId, true);

    const membership = (team as any).members.find(
      (m: any) => m.userId === userId,
    );
    if (!membership)
      throw new ForbiddenException("You are not a member of this team");

    if (membership.role !== "CAPTAIN")
      throw new ForbiddenException(
        "Only the team captain can perform this action",
      );

    return team;
  }
  /** Ensures the caller is the event owner or an event admin. */
  private async assertEventOwnerOrAdmin(eventId: string, userId: string) {
    const event = await this.findEventOrThrow(eventId);

    if (event.ownerId === userId) return event;

    const membership = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!membership || membership.role === "MEMBER") {
      throw new ForbiddenException(
        "Only the event owner or admins can perform this action",
      );
    }

    return event;
  }

  private async hasEventStarted(eventId: string): Promise<boolean> {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { startDate: true },
    });

    return !event.startDate || event.startDate <= new Date();
  }
  private async hasEventEnded(eventId: string): Promise<boolean> {
    const event = await this.prisma.event.findUniqueOrThrow({
      where: { id: eventId },
      select: { endDate: true },
    });

    return !event.endDate || event.endDate <= new Date();
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

  async getEventTeams(user: any, eventId: string) {
    await this.assertEventOwnerOrAdmin(eventId, user.id);
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

    if (await this.hasEventEnded(eventId))
      throw new BadRequestException("Event has already ended");

    // Block if user is already on any team in this event
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: { userId, team: { eventId } },
    });
    if (existingMembership)
      throw new ConflictException(
        "You are already a member of a team in this event",
      );

    // Enforce unique team name per event
    const nameConflict = await this.prisma.team.findFirst({
      where: { eventId, name },
    });
    if (nameConflict)
      throw new ConflictException(
        `A team named with the same name already exists in this event`,
      );
    try {
      return await this.prisma.team.create({
        data: {
          name,
          teamPassword,
          eventId,
          members: {
            create: { userId, role: "CAPTAIN", eventId },
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
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new ConflictException(
          `A team named with the same name already exists in this event`,
        );
      }
      throw err;
    }
  }

  async joinTeam(
    eventId: string,
    password: string,
    teamName: string,
    userId: string,
  ) {
    await this.findEventOrThrow(eventId);
    await this.assertEventMember(eventId, userId);
    if (await this.hasEventEnded(eventId))
      throw new BadRequestException("Event has already ended");

    const team = await this.findTeamWithName(teamName, eventId);

    const existingMembership = await this.prisma.teamMember.findFirst({
      where: {
        userId,
        eventId,
      },
    });
    if (existingMembership)
      throw new ConflictException(
        "You are already a member of a team in this event",
      );

    if (team.teamPassword !== password)
      throw new ForbiddenException("Incorrect team password");

    try {
      return await this.prisma.teamMember.create({
        data: {
          userId,
          teamId: team.id,
          eventId: team.eventId,
          role: "MEMBER",
        },
        select: {
          id: true,
          role: true,
          teamId: true,
          userId: true,
          createdAt: true,
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new ConflictException(
          "You are already a member of a team in this event",
        );
      }

      throw err;
    }
  }

  async leaveTeam(eventId: string, teamId: string, userId: string) {
    const team = await this.findTeamOrThrow(teamId, true);

    if (team.eventId !== eventId)
      throw new BadRequestException("Team does not belong to this event");

    const membership = (team as any).members.find(
      (m: any) => m.userId === userId,
    );
    if (!membership)
      throw new ForbiddenException("You are not a member of this team");

    if (membership.role === "CAPTAIN")
      throw new ForbiddenException(
        "Captains cannot leave the team, delete it instead",
      );

    await this.prisma.teamMember.delete({
      where: { userId_teamId: { userId, teamId } },
    });

    return { message: "Left the team successfully" };
  }

  async deleteTeam(eventId: string, teamId: string, userId: string) {
    const team = await this.findTeamOrThrow(teamId, true);

    if (team.eventId !== eventId)
      throw new BadRequestException("Team does not belong to this event");

    const membership = (team as any).members.find(
      (m: any) => m.userId === userId,
    );

    if (!membership)
      throw new ForbiddenException("You are not a member of this team");

    if (membership.role !== "CAPTAIN")
      throw new ForbiddenException("Only the team captain can delete the team");

    await this.prisma.team.delete({ where: { id: teamId } });

    return { message: "Team deleted successfully" };
  }

  async getTeamDetails(eventId: string, userId: string) {
    await this.findEventOrThrow(eventId);

    if (await this.hasEventEnded(eventId)) {
      throw new BadRequestException(ENDED_MESSAGE);
    }

    if (!(await this.hasEventStarted(eventId))) {
      throw new BadRequestException(NOT_STARTED_MESSAGE);
    }
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
      throw new NotFoundException("You are not part of any team in this event");

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
  async updateTeam(
    eventId: string,
    teamId: string,
    userId: string,
    { name }: UpdateTeamDto,
  ) {
    const team = await this.assertTeamCaptain(teamId, userId);

    if (team.eventId !== eventId)
      throw new BadRequestException("Team does not belong to this event");

    if (name && name !== team.name) {
      const nameConflict = await this.prisma.team.findFirst({
        where: { eventId: team.eventId, name, id: { not: teamId } },
      });
      if (nameConflict)
        throw new ConflictException(
          `A team named with the same name already exists in this event`,
        );
    }

    try {
      return await this.prisma.team.update({
        where: { id: teamId },
        data: {
          ...(name && { name }),
        },
        select: {
          id: true,
          name: true,
          eventId: true,
          updatedAt: true,
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new ConflictException(
          `A team named with the same name already exists in this event`,
        );
      }
      throw err;
    }
  }

  async kickMember(
    eventId: string,
    teamId: string,
    captainId: string,
    targetUserId: string,
  ) {
    const team = await this.assertTeamCaptain(teamId, captainId);

    if (team.eventId !== eventId)
      throw new BadRequestException("Team does not belong to this event");

    if (targetUserId === captainId)
      throw new BadRequestException(
        "Captains cannot kick themselves; delete the team instead",
      );

    const targetMembership = (team as any).members.find(
      (m: any) => m.userId === targetUserId,
    );
    if (!targetMembership)
      throw new NotFoundException("That user is not a member of this team");

    await this.prisma.teamMember.delete({
      where: { userId_teamId: { userId: targetUserId, teamId } },
    });

    return { message: "Member removed from the team successfully" };
  }

  async getTeamById(eventId: string, teamId: string, userId: string) {
    let isOwnerOrAdmin = false;
    try {
      await this.assertEventOwnerOrAdmin(eventId, userId);
      isOwnerOrAdmin = true;
    } catch {
      // not owner/admin; falls through to the team-membership check
    }

    if (!isOwnerOrAdmin) {
      const membership = await this.prisma.teamMember.findFirst({
        where: { userId, teamId, eventId },
        select: { id: true },
      });
      if (!membership) {
        throw new ForbiddenException("You are not a member of this team");
      }
    }

    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        eventId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
    });

    if (!team) throw new NotFoundException("Team not found in this event");

    return {
      id: team.id,
      name: team.name,
      createdAt: team.createdAt,
      members: team.members.map((m) => ({
        userId: m.user.id,
        username: m.user.username,
        role: m.role,
      })),
    };
  }
}
