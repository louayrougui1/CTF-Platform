import { Module } from '@nestjs/common';
import { EventMemberController } from './event-member.controller';
import { EventMemberService } from './event-member.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
@Module({
  controllers: [EventMemberController],
  providers: [EventMemberService, JwtStrategy],
})
export class EventMemberModule {}
