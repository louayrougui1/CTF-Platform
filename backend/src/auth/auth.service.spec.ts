import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './otp/sendEmail';
import { OtpService } from './otp/otp.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: {
            user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
          },
        },
        { provide: JwtService, useValue: { sign: jest.fn(), verify: jest.fn() } },
        { provide: MailerService, useValue: { sendOtpEmail: jest.fn() } },
        {
          provide: OtpService,
          useValue: { createOtp: jest.fn(), verifyOtp: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
