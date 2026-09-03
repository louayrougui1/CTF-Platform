import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { CreateChallengeDto } from "./dto/challengeCreate.dto";
import { UpdateChallengeDto } from "./dto/updateChallenge.dto";
import { SubmitFlagDto } from "./dto/submitFlag.dto";
import { StorageService } from "../storage/storage.service";

// Public-facing select — never expose the `flag` field here.
const CHALLENGE_SELECT = {
  id: true,
  title: true,
  description: true,
  points: true,
  category: true,
  difficulty: true,
  eventId: true,
  createdAt: true,
  updatedAt: true,
  hasFile: true,
  fileUrl: true,
  fileName: true,
} as const;

const NOT_STARTED_MESSAGE = "Event did not start yet.";

const ENDED_MESSAGE = "Event has ended.";

@Injectable()
export class ChallengeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  // ─── PRIVATE HELPERS ────────────────────────────────────────────────────────

  private async findChallengeOrThrow(challengeId: string) {
    const challenge = await this.prisma.challenge.findUnique({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException("Challenge not found");
    }

    return challenge;
  }

  private async assertEventOwnerOrAdmin(eventId: string, userId: string) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      select: {
        ownerId: true,
        members: {
          where: { role: { in: ["OWNER", "ADMIN"] } },
          select: { userId: true, role: true },
        },
      },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    const isOwner = event.ownerId === userId;
    const isAdmin = event.members.some(
      (m) => m.userId === userId && m.role === "ADMIN",
    );

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException(
        "You are not allowed to manage challenges for this event",
      );
    }

    return event;
  }

  /**
   * Throws NotFoundException if the user is not a member of the event.
   * Uses NotFound (not Forbidden) so non-members can't distinguish
   * "doesn't exist" from "exists but you're not in it".
   */
  private async assertEventMember(eventId: string, userId: string) {
    const membership = await this.prisma.eventMember.findUnique({
      where: { userId_eventId: { userId, eventId } },
    });

    if (!membership) {
      throw new NotFoundException("Event not found");
    }

    return membership;
  }

  /** Returns true once the event's startDate has passed (or has none set). */
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

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  async getChallengesByEvent(user: any, eventId: string, teamId?: string) {
    let isOwnerOrAdmin = false;
    try {
      await this.assertEventOwnerOrAdmin(eventId, user.id);
      isOwnerOrAdmin = true;
    } catch {
      isOwnerOrAdmin = false;
    }

    let solvedIds = new Set<string>();

    if (!isOwnerOrAdmin) {
      await this.assertEventMember(eventId, user.id);

      if (!(await this.hasEventStarted(eventId))) {
        throw new BadRequestException(NOT_STARTED_MESSAGE);
      }

      if (!teamId) {
        throw new ForbiddenException(
          "You must be a team member to view challenges",
        );
      }

      const membership = await this.prisma.teamMember.findFirst({
        where: { userId: user.id, teamId, eventId },
        select: { id: true },
      });

      if (!membership) {
        throw new ForbiddenException("You are not a member of this team");
      }

      const submissions = await this.prisma.submission.findMany({
        where: { teamId },
        select: { challengeId: true },
      });
      solvedIds = new Set(submissions.map((s) => s.challengeId));
    }

    const challenges = await this.prisma.challenge.findMany({
      where: { eventId },
      select: CHALLENGE_SELECT,
    });

    return Promise.all(
      challenges.map(async (c) => {
        const challenge = { ...c, solved: solvedIds.has(c.id) };
        if (challenge.hasFile && challenge.fileUrl) {
          challenge.fileUrl = await this.storageService.getSignedUrl(
            challenge.fileUrl,
          );
        }
        return challenge;
      }),
    );
  }

  async getChallenge(user: any, eventId: string, id: string) {
    const challenge = await this.findChallengeOrThrow(id);

    if (challenge.eventId !== eventId) {
      throw new NotFoundException("Challenge not found");
    }

    await this.assertEventOwnerOrAdmin(challenge.eventId, user.id);

    const { flag, ...challengeData } = challenge;
    if (challengeData.hasFile && challengeData.fileUrl) {
      // challenge.fileUrl currently holds the PATH — convert to a live signed URL
      challengeData.fileUrl = await this.storageService.getSignedUrl(
        challengeData.fileUrl,
      );
    }

    return challengeData;
  }

  async getChallengeSolveCount(user: any, challengeId: string) {
    const challenge = await this.findChallengeOrThrow(challengeId);

    await this.assertEventMember(challenge.eventId, user.id);

    if (!(await this.hasEventStarted(challenge.eventId))) {
      throw new BadRequestException(NOT_STARTED_MESSAGE);
    }

    const solveCount = await this.prisma.submission.count({
      where: { challengeId },
    });
    return { solveCount };
  }

  // ─── MUTATIONS ──────────────────────────────────────────────────────────────

  async createChallenge(
    user: any,
    eventId: string,
    dto: CreateChallengeDto,
    file?: Express.Multer.File,
  ) {
    await this.assertEventOwnerOrAdmin(eventId, user.id);
    let fileUrl: string | undefined;
    if (file) {
      const { path } = await this.storageService.upload(file);
      fileUrl = path; // storing the storage PATH, not a signed URL — see note below
    }
    return this.prisma.challenge.create({
      data: {
        ...dto,
        eventId,
        hasFile: !!file,
        fileUrl,
        fileName: file?.originalname,
      },
      select: CHALLENGE_SELECT,
    });
  }

  async updateChallenge(
    user: any,
    id: string,
    eventId: string,
    dto: UpdateChallengeDto,
    file?: Express.Multer.File,
  ) {
    console.log("Updating challenge with DTO:", dto);
    const challenge = await this.findChallengeOrThrow(id);
    if (challenge.eventId !== eventId) {
      throw new NotFoundException("Challenge not found");
    }
    await this.assertEventOwnerOrAdmin(challenge.eventId, user.id);

    const data: Prisma.ChallengeUpdateInput = { ...dto };

    if (file) {
      const { path } = await this.storageService.upload(file);
      data.hasFile = true;
      data.fileUrl = path;
      data.fileName = file.originalname;

      // Replace the previously stored file, if any, to avoid orphaned objects
      if (challenge.hasFile && challenge.fileUrl) {
        await this.storageService.delete(challenge.fileUrl);
      }
    }

    return this.prisma.challenge.update({
      where: { id },
      data,
      select: CHALLENGE_SELECT,
    });
  }

  async deleteChallenge(user: any, eventId: string, id: string) {
    const challenge = await this.findChallengeOrThrow(id);

    if (challenge.eventId !== eventId) {
      throw new NotFoundException("Challenge not found");
    }

    await this.assertEventOwnerOrAdmin(challenge.eventId, user.id);

    if (challenge.hasFile && challenge.fileUrl) {
      await this.storageService.delete(challenge.fileUrl);
    }

    return this.prisma.challenge.delete({
      where: { id },
      select: CHALLENGE_SELECT,
    });
  }

  async submitFlag(
    user: any,
    eventId: string,
    challengeId: string,
    dto: SubmitFlagDto,
  ) {
    const challenge = await this.findChallengeOrThrow(challengeId);

    if (challenge.eventId !== eventId) {
      throw new NotFoundException("Challenge not found");
    }

    await this.assertEventMember(challenge.eventId, user.id);

    if (!(await this.hasEventStarted(challenge.eventId))) {
      throw new BadRequestException(NOT_STARTED_MESSAGE);
    }

    if (await this.hasEventEnded(challenge.eventId)) {
      throw new BadRequestException(
        "Event has ended.Challenge submissions are no longer accepted.",
      );
    }

    const membership = await this.prisma.teamMember.findFirst({
      where: { userId: user.id, eventId: challenge.eventId },
      select: { teamId: true },
    });

    if (!membership) {
      throw new BadRequestException(
        "You must be on a team to solve challenges",
      );
    }

    const alreadySolved = await this.prisma.submission.findFirst({
      where: { challengeId, teamId: membership.teamId },
      select: { id: true },
    });

    if (alreadySolved) {
      throw new BadRequestException(
        "You and your team have already solved this challenge",
      );
    }

    const isCorrect = dto.flag.trim() === challenge.flag.trim();

    if (!isCorrect) {
      return {
        status: "WRONG",
        createdAt: new Date(),
      };
    }

    try {
      const submission = await this.prisma.submission.create({
        data: {
          userId: user.id,
          challengeId,
          teamId: membership.teamId,
        },
        select: {
          createdAt: true,
        },
      });

      return {
        status: "CORRECT",
        createdAt: submission.createdAt,
      };
    } catch (err: any) {
      if (err.code === "P2002") {
        throw new BadRequestException(
          "You and your team have already solved this challenge",
        );
      }
      throw err;
    }
  }
}
