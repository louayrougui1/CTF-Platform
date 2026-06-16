import { TeamService } from './team.service';
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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { AddAdminDto } from '../event-member/dto/addAdmin.dto';
import { RemoveAdminDto } from '../event-member/dto/removeAdmin.dto';
import type { Request } from 'express';

@UseGuards(JwtGuard)
@Controller('team')
export class TeamController {
  constructor(private readonly teamService: TeamService) {}
  @Get(':id/stats')
  getEventStats(@Param('id') id: string) {
    return this.teamService.getEventStats(id);
  }

  @Get(':id/teams')
  getEventTeams(@Param('id') id: string) {
    return this.teamService.getEventTeams(id);
  }
}
