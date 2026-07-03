import { Module } from '@nestjs/common';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';

@Module({
  controllers: [ChallengeController],
  providers: [ChallengeService, JwtStrategy],
})
export class ChallengeModule {}
