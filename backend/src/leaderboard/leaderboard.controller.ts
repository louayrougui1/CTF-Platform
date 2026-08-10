import { LeaderboardService } from './leaderboard.service';
import { Controller, Get, UseGuards, Param } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { ApiBearerAuth, ApiOkResponse } from '@nestjs/swagger';
import { LeaderboardResponseDto } from './dto/leaderboard-response.dto';

@UseGuards(JwtGuard)
@ApiBearerAuth()
@Controller('events/:eventId/leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderBoardService: LeaderboardService) {}
  @Get()
  @ApiOkResponse({ type: LeaderboardResponseDto, isArray: true })
  getEventLeaderboard(@Param('eventId') id: string) {
    return this.leaderBoardService.getEventLeaderboard(id);
  }
}
