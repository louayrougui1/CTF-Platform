import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OtpCleanupService {
  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredOtps() {
    await this.prisma.otp.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }
}
