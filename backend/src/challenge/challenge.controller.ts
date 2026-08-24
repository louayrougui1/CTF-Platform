import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Req,
  Param,
  Body,
  UseGuards,
  Query,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ChallengeService } from "./challenge.service";
import { JwtGuard } from "../auth/guards/jwt.guard";
import { CreateChallengeDto } from "./dto/challengeCreate.dto";
import { UpdateChallengeDto } from "./dto/updateChallenge.dto";
import { SubmitFlagDto } from "./dto/submitFlag.dto";
import type { Request } from "express";
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { ChallengeResponseDto } from "./dto/challenge-response.dto";
import { ChallengeStatsResponseDto } from "./dto/challenge-stats-response.dto";
import { SubmissionResponseDto } from "./dto/submission-response.dto";

@Controller("events/:eventId/challenges")
@UseGuards(JwtGuard)
@ApiBearerAuth()
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  // ─── QUERIES ────────────────────────────────────────────────────────────────

  @Get()
  @ApiOkResponse({ type: ChallengeResponseDto, isArray: true })
  @ApiQuery({
    name: "teamId",
    required: false,
    type: String,
    description:
      "Team id; required for non-admin callers, returns each challenge with a solved flag",
  })
  getChallengesByEvent(
    @Param("eventId") eventId: string,
    @Query("teamId") teamId: string | undefined,
    @Req() req: Request,
  ) {
    return this.challengeService.getChallengesByEvent(
      req.user,
      eventId,
      teamId,
    );
  }

  @Get(":challengeId")
  @ApiOkResponse({ type: ChallengeResponseDto })
  getChallenge(
    @Param("eventId") eventId: string,
    @Param("challengeId") challengeId: string,
    @Req() req: Request,
  ) {
    return this.challengeService.getChallenge(req.user, eventId, challengeId);
  }

  @Get(":challengeId/stats")
  @ApiOkResponse({ type: ChallengeStatsResponseDto })
  getChallengeSolveCount(
    @Param("challengeId") challengeId: string,
    @Req() req: Request,
  ) {
    return this.challengeService.getChallengeSolveCount(req.user, challengeId);
  }

  // ─── MUTATIONS ──────────────────────────────────────────────────────────────
  @UseInterceptors(FileInterceptor("file"))
  @Post()
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        flag: { type: "string" },
        category: {
          type: "string",
          enum: [
            "WEB",
            "CRYPTO",
            "PWN",
            "REVERSE",
            "FORENSICS",
            "OSINT",
            "MISC",
          ],
        },
        difficulty: {
          type: "string",
          enum: ["EASY", "MEDIUM", "HARD", "EXPERT"],
        },
        points: { type: "number" },
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiCreatedResponse({ type: ChallengeResponseDto })
  createChallenge(
    @Param("eventId") eventId: string,
    @Req() req: Request,
    @Body() dto: CreateChallengeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.challengeService.createChallenge(req.user, eventId, dto, file);
  }

  @ApiConsumes("multipart/form-data")
  @UseInterceptors(FileInterceptor("file"))
  @Patch(":challengeId")
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        description: { type: "string" },
        flag: { type: "string" },
        category: {
          type: "string",
          enum: [
            "WEB",
            "CRYPTO",
            "PWN",
            "REVERSE",
            "FORENSICS",
            "OSINT",
            "MISC",
          ],
        },
        difficulty: {
          type: "string",
          enum: ["EASY", "MEDIUM", "HARD", "EXPERT"],
        },
        points: { type: "number" },
        file: {
          type: "string",
          format: "binary",
        },
      },
    },
  })
  @ApiOkResponse({ type: ChallengeResponseDto })
  updateChallenge(
    @Param("challengeId") challengeId: string,
    @Param("eventId") eventId: string,
    @Req() req: Request,
    @Body() dto: UpdateChallengeDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.challengeService.updateChallenge(
      req.user,
      challengeId,
      eventId,
      dto,
      file,
    );
  }

  @Delete(":challengeId")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: ChallengeResponseDto })
  deleteChallenge(
    @Param("eventId") eventId: string,
    @Param("challengeId") challengeId: string,
    @Req() req: Request,
  ) {
    return this.challengeService.deleteChallenge(req.user, eventId, challengeId);
  }

  // sumbission of flag

  @Post(":challengeId/submit")
  @ApiCreatedResponse({ type: SubmissionResponseDto })
  submitFlag(
    @Param("eventId") eventId: string,
    @Param("challengeId") challengeId: string,
    @Req() req: Request,
    @Body() dto: SubmitFlagDto,
  ) {
    return this.challengeService.submitFlag(req.user, eventId, challengeId, dto);
  }
}
