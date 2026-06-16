import { LeaderboardService } from './leaderboard.service';
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
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderBoardService: LeaderboardService) {}
  @Get(':id/leaderboard')
  getEventLeaderboard(@Param('id') id: string) {
    return this.leaderBoardService.getEventLeaderboard(id);
  }
}
