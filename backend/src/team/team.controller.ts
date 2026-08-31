import { TeamService } from "./team.service";

import {
  Controller,
  Get,
  Post,
  Delete,
  Req,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Patch,
} from "@nestjs/common";
import { JwtGuard } from "../auth/guards/jwt.guard";
import type { Request } from "express";
import { CreateTeamDto } from "./dto/createTeam.dto";
import { JoinTeamDto } from "./dto/joinTeam.dto";
import { UpdateTeamDto } from "./dto/updateTeam.dto";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiCreatedResponse,
} from "@nestjs/swagger";
import { TeamListResponseDto } from "./dto/team-list-response.dto";
import { TeamDetailResponseDto } from "./dto/team-detail-response.dto";
import { TeamByIdResponseDto } from "./dto/team-by-id-response.dto";
import { TeamCreateResponseDto } from "./dto/team-create-response.dto";
import { TeamMembershipResponseDto } from "./dto/team-membership-response.dto";
import { TeamUpdateResponseDto } from "./dto/team-update-response.dto";
import { TeamMessageResponseDto } from "./dto/team-message-response.dto";

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller("events/:eventId/teams")
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  @ApiOkResponse({ type: TeamListResponseDto, isArray: true })
  getEventTeams(@Param("eventId") eventId: string, @Req() req: Request) {
    return this.teamService.getEventTeams(req.user, eventId);
  }

  @Get("me")
  @ApiOkResponse({ type: TeamDetailResponseDto })
  getTeamDetails(@Param("eventId") eventId: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.teamService.getTeamDetails(eventId, userId);
  }
  @Get(":teamId")
  @ApiOkResponse({ type: TeamByIdResponseDto })
  getTeamById(
    @Param("eventId") eventId: string,
    @Param("teamId") teamId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.teamService.getTeamById(eventId, teamId, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiCreatedResponse({ type: TeamCreateResponseDto })
  createTeam(
    @Param("eventId") eventId: string,
    @Body() dto: CreateTeamDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.teamService.createTeam(eventId, userId, dto);
  }

  @Post("join")
  @HttpCode(HttpStatus.OK)
  @ApiCreatedResponse({ type: TeamMembershipResponseDto })
  joinTeam(
    @Param("eventId") eventId: string,
    @Req() req: Request,
    @Body() dto: JoinTeamDto,
  ) {
    const userId = (req.user as any).id;
    return this.teamService.joinTeam(
      eventId,
      dto.password,
      dto.teamName,
      userId,
    );
  }

  @Patch(":teamId")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: TeamUpdateResponseDto })
  updateTeam(
    @Param("eventId") eventId: string,
    @Param("teamId") teamId: string,
    @Body() dto: UpdateTeamDto,
    @Req() req: Request,
  ) {
    const captainId = (req.user as any).id;
    return this.teamService.updateTeam(eventId, teamId, captainId, dto);
  }
  @Delete(":teamId/leave")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: TeamMessageResponseDto })
  leaveTeam(
    @Param("eventId") eventId: string,
    @Param("teamId") teamId: string,
    @Req() req: Request,
  ) {
    const captainId = (req.user as any).id;
    return this.teamService.leaveTeam(eventId, teamId, captainId);
  }

  @Delete(":teamId")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: TeamMessageResponseDto })
  deleteTeam(
    @Param("eventId") eventId: string,
    @Param("teamId") teamId: string,
    @Req() req: Request,
  ) {
    const captainId = (req.user as any).id;
    return this.teamService.deleteTeam(eventId, teamId, captainId);
  }

  @Delete(":teamId/members/:userId")
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: TeamMessageResponseDto })
  kickMember(
    @Param("eventId") eventId: string,
    @Param("teamId") teamId: string,
    @Param("userId") targetUserId: string,
    @Req() req: Request,
  ) {
    const captainId = (req.user as any).id;
    return this.teamService.kickMember(
      eventId,
      teamId,
      captainId,
      targetUserId,
    );
  }
}
