import { Module } from '@nestjs/common';
import { EventController } from './event.controller';
import { EventService } from './event.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
@Module({
  controllers: [EventController],
  providers: [EventService, JwtStrategy],
})
export class EventModule {}
