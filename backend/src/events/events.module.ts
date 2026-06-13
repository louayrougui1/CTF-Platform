import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
@Module({
  controllers: [EventsController],
  providers: [EventsService, JwtStrategy],
})
export class EventsModule {}
