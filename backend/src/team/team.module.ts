import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
@Module({
  controllers: [TeamController],
  providers: [TeamService, JwtStrategy],
})
export class TeamModule {}
