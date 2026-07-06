// otp.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { OtpPurpose } from '@prisma/client';
import { generateOtp } from './otpGenerate';

const OTP_TTL_MS = 2 * 60 * 1000;
const MAX_ATTEMPTS = 5;

@Injectable()
export class OtpService {
  constructor(private prisma: PrismaService) {}

  async createOtp(userId: string, purpose: OtpPurpose): Promise<string> {
    await this.prisma.otp.updateMany({
      where: { userId, purpose, consumed: false },
      data: { consumed: true },
    });

    const code = generateOtp(6);
    const codeHash = await bcrypt.hash(code, 10);

    await this.prisma.otp.create({
      data: {
        userId,
        purpose,
        codeHash,
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });

    return code;
  }

  async verifyOtp(
    userId: string,
    purpose: OtpPurpose,
    code: string,
  ): Promise<void> {
    const otp = await this.prisma.otp.findFirst({
      where: { userId, purpose, consumed: false },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp) throw new BadRequestException('No active OTP found');
    if (otp.expiresAt < new Date())
      throw new BadRequestException('OTP expired');
    if (otp.attempts >= MAX_ATTEMPTS)
      throw new BadRequestException('Too many attempts');

    const isValid = await bcrypt.compare(code, otp.codeHash);

    if (!isValid) {
      await this.prisma.otp.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid OTP');
    }
    await this.prisma.otp.delete({ where: { id: otp.id } }); // consumed → delete immediately, keeps table lean
  }
}
