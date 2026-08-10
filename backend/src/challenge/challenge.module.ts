import { Module } from '@nestjs/common';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { JwtStrategy } from '../auth/strategies/jwt.strategy';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 1024 * 1024,
      },
    }),
    StorageModule,
  ],
  controllers: [ChallengeController],
  providers: [ChallengeService, JwtStrategy],
})
export class ChallengeModule {}
