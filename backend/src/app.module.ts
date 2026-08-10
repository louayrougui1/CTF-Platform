import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { TeamModule } from './team/team.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { EventMemberModule } from './event-member/event-member.module';
import { ChallengeModule } from './challenge/challenge.module';
import { SupabaseModule } from './supabase/supabase.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    UserModule,
    EventModule,
    TeamModule,
    LeaderboardModule,
    EventMemberModule,
    ChallengeModule,
    SupabaseModule,
    StorageModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
