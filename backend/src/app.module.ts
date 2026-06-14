import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { EventModule } from './event/event.module';
import { TeamModule } from './team/team.module';

@Module({
  imports: [AuthModule, PrismaModule, UserModule, EventModule, TeamModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
