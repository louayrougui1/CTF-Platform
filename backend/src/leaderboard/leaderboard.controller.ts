import { Controller } from '@nestjs/common';
import { LeaderboardService } from './leaderboard.service';
import { Get, Param } from '@nestjs/common';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderBoardService: LeaderboardService) {}
  @Get(':id/leaderboard')
  getEventLeaderboard(@Param('id') id: string) {
    return this.leaderBoardService.getEventLeaderboard(id);
  }
}
