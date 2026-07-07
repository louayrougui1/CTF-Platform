import { TeamService } from './team.service';

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
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import type { Request } from 'express';
import { CreateTeamDto } from './dto/createTeam.dto';
import { JoinTeamDto } from './dto/joinTeam.dto';
import { UpdateTeamDto } from './dto/updateTeam.dto';

@UseGuards(JwtGuard)
@Controller('events/:eventId/teams')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}

  @Get()
  getEventTeams(@Param('eventId') eventId: string) {
    return this.teamService.getEventTeams(eventId);
  }

  @Get('me')
  getTeamDetails(@Param('eventId') eventId: string, @Req() req: Request) {
    const userId = (req.user as any).id;
    return this.teamService.getTeamDetails(eventId, userId);
  }
  @Get(':teamId')
  getTeamById(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.teamService.getTeamById(eventId, teamId, userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  createTeam(
    @Param('eventId') eventId: string,
    @Body() dto: CreateTeamDto,
    @Req() req: Request,
  ) {
    const userId = (req.user as any).id;
    return this.teamService.createTeam(eventId, userId, dto);
  }

  @Post(':teamId/join')
  @HttpCode(HttpStatus.OK)
  joinTeam(
    @Param('eventId') eventId: string,
    @Param('teamId') teamId: string,
    @Req() req: Request,
    @Body() dto: JoinTeamDto,
  ) {
    const userId = (req.user as any).id;
    return this.teamService.joinTeam(eventId, teamId, dto.password, userId);
  }

  @Patch(':teamId')
  @HttpCode(HttpStatus.OK)
  updateTeam(
    @Param('teamId') teamId: string,
    @Body() dto: UpdateTeamDto,
    @Req() req: Request,
  ) {
    const captainId = (req.user as any).id;
    return this.teamService.updateTeam(teamId, captainId, dto);
  }
  @Delete(':teamId/leave')
  @HttpCode(HttpStatus.OK)
  leaveTeam(@Param('teamId') teamId: string, @Req() req: Request) {
    const captainId = (req.user as any).id;
    return this.teamService.leaveTeam(teamId, captainId);
  }

  @Delete(':teamId')
  @HttpCode(HttpStatus.OK)
  deleteTeam(@Param('teamId') teamId: string, @Req() req: Request) {
    const captainId = (req.user as any).id;
    return this.teamService.deleteTeam(teamId, captainId);
  }

  @Delete(':teamId/members/:userId')
  @HttpCode(HttpStatus.OK)
  kickMember(
    @Param('teamId') teamId: string,
    @Param('userId') targetUserId: string,
    @Req() req: Request,
  ) {
    const captainId = (req.user as any).id;
    return this.teamService.kickMember(teamId, captainId, targetUserId);
  }
}
