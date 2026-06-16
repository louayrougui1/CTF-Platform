import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { LeaderboardService } from './leaderboard.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

@Module({
  controllers: [LeaderboardController],
  providers: [LeaderboardService, JwtStrategy],
})
export class LeaderboardModule {}
