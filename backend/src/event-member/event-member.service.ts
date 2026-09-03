import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { AddAdminDto } from "./dto/addAdmin.dto";
import { RemoveAdminDto } from "./dto/removeAdmin.dto";
import { JoinEventDto } from "./dto/joinEvent.dto";

export const ADMIN_TEAM_NAME = "_Admins";

@Injectable()
export class EventMemberService {
  constructor(private readonly prisma: PrismaService) {}
  private async findEventOrThrow(eventId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    return event;
  }

  private async assertEventOwner(eventId: string, userId: string) {
    const event = await this.findEventOrThrow(eventId);

    if (event.ownerId !== userId) {
      throw new ForbiddenException(
        "Only the event owner can perform this action",
      );
    }

    return event;
  }

  // Ensures the caller is either the event owner or a member of the event.
  // Use this to gate actions that should be limited to people already
  // associated with the event, rather than anyone who knows the eventId.
  private async assertEventMember(eventId: string, userId: string) {
    const member = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });
    if (!member)
      throw new ForbiddenException("You are not a member of this event");
    return member;
  }

  async getEventMembers(user: any, eventId: string) {
    await this.findEventOrThrow(eventId);
    const membership = await this.assertEventMember(eventId, user.id);
    if (membership.role === "MEMBER") {
      throw new ForbiddenException(
        "Only event admins can view the list of members",
      );
    }

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
      orderBy: { createdAt: "asc" },
    });
  }

  async addEventAdmin(user: any, dto: AddAdminDto) {
    await this.assertEventOwner(dto.eventId, user.id);

    if (dto.userIdToPromote === user.id) {
      throw new BadRequestException("Event owner cannot be assigned as admin");
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
      throw new NotFoundException("User is not an event member");
    }

    if (member.role === "ADMIN") {
      throw new BadRequestException("User is already an admin of this event");
    }

    const updated = await this.prisma.eventMember.update({
      where: {
        userId_eventId: {
          userId: dto.userIdToPromote,
          eventId: dto.eventId,
        },
      },
      data: { role: "ADMIN" },
    });

    // Remove from any regular team first (a user can only be on one team per event)
    const existingMembership = await this.prisma.teamMember.findFirst({
      where: { userId: dto.userIdToPromote, eventId: dto.eventId },
    });
    if (existingMembership) {
      await this.prisma.teamMember.delete({
        where: {
          userId_teamId: {
            userId: dto.userIdToPromote,
            teamId: existingMembership.teamId,
          },
        },
      });
    }

    // Add to the _Admins team
    const adminTeam = await this.prisma.team.findFirst({
      where: { eventId: dto.eventId, name: ADMIN_TEAM_NAME },
    });
    if (adminTeam) {
      await this.prisma.teamMember.create({
        data: {
          userId: dto.userIdToPromote,
          teamId: adminTeam.id,
          eventId: dto.eventId,
          role: "MEMBER",
        },
      });
    }

    return updated;
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
      throw new NotFoundException("User is not an event member");
    }

    if (member.role !== "ADMIN") {
      throw new BadRequestException("User is not an admin of this event");
    }

    const updated = await this.prisma.eventMember.update({
      where: {
        userId_eventId: {
          userId: dto.userIdToRemove,
          eventId: dto.eventId,
        },
      },
      data: { role: "MEMBER" },
    });

    // Remove from the _Admins team
    const adminTeam = await this.prisma.team.findFirst({
      where: { eventId: dto.eventId, name: ADMIN_TEAM_NAME },
    });
    if (adminTeam) {
      await this.prisma.teamMember.deleteMany({
        where: { userId: dto.userIdToRemove, teamId: adminTeam.id },
      });
    }

    return updated;
  }

  // ─── MEMBERSHIP ─────────────────────────────────────────────────────────────

  async joinEventByCode(user: any, dto: JoinEventDto) {
    if (!dto.inviteCode?.trim()) {
      throw new BadRequestException("Invite code is required");
    }

    const event = await this.prisma.event.findUnique({
      where: { inviteCode: dto.inviteCode.trim() },
    });

    if (!event) {
      throw new NotFoundException("Invalid invite code");
    }

    try {
      return await this.prisma.eventMember.create({
        data: {
          userId: user.id,
          eventId: event.id,
          role: "MEMBER",
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new ConflictException("User is already a member of this event");
      }
      throw err;
    }
  }

  async joinEvent(user: any, eventId: string) {
    const event = await this.findEventOrThrow(eventId);

    if (!event.isPublic) {
      throw new BadRequestException(
        "Cannot join a private event without an invite code",
      );
    }

    try {
      return await this.prisma.eventMember.create({
        data: {
          userId: user.id,
          eventId,
          role: "MEMBER",
        },
      });
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new ConflictException("User is already a member of this event");
      }
      throw err;
    }
  }

  async leaveEvent(user: any, eventId: string) {
    const event = await this.findEventOrThrow(eventId);

    if (event.ownerId === user.id) {
      throw new BadRequestException("Event owner cannot leave the event");
    }

    const member = await this.prisma.eventMember.findUnique({
      where: {
        userId_eventId: { userId: user.id, eventId },
      },
    });

    if (!member) {
      throw new BadRequestException("User is not a member of this event");
    }

    await this.prisma.teamMember.deleteMany({
      where: { userId: user.id, eventId },
    });

    return this.prisma.eventMember.delete({
      where: {
        userId_eventId: { userId: user.id, eventId },
      },
    });
  }
}
