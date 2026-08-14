import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from './otp/sendEmail';
import { OtpService } from './otp/otp.service';
import { OtpPurpose } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { ResendOtpDto } from './dto/resendOtp.dto';
import * as crypto from 'crypto';
// ...existing imports
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailerService,
    private otpService: OtpService,
  ) {}
  private generateAccessToken(user: any) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: '60m',
      },
    );
  }

  private generateRefreshToken(user: any) {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET is not defined');
    }
    return this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      },
    );
  }
  setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
  }

  async validateUser({ email, password }: AuthPayloadDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in.',
      );
    }
    if (!user.password) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // 2. Login (generate JWT)
  async login(user: any, res: Response) {
    const { password, ...safeUser } = user;
    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = this.generateRefreshToken(safeUser);
    this.setRefreshTokenCookie(res, refreshToken);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }
  async register({ email, username, password }: RegisterDto, res: Response) {
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      // Check if an OAuth-only account exists with this email
      const existing = await this.prisma.user.findUnique({ where: { email } });

      let user;

      if (existing) {
        if (existing.password !== null) {
          // Has a password already — genuine duplicate
          throw new BadRequestException('Email already in use');
        }

        // OAuth-only account — silently link by adding the password
        user = await this.prisma.user.update({
          where: { id: existing.id },
          data: { password: hashedPassword },
        });
      } else {
        // Fresh registration
        try {
          user = await this.prisma.user.create({
            data: { email, username, password: hashedPassword },
          });
        } catch (err: any) {
          if (err.code === 'P2002') {
            throw new ConflictException('Email already in use');
          }
          throw err;
        }
      }

      const otp = await this.otpService.createOtp(
        user.id,
        OtpPurpose.EMAIL_VERIFICATION,
      );

      await this.mailService.sendOtpEmail(
        user.email,
        otp,
        'Email Verification',
      );

      return {
        message: 'Verification code sent.',
      };
      // const { password, ...safeUser } = user;

      // const accessToken = this.generateAccessToken(safeUser);
      // const refreshToken = this.generateRefreshToken(safeUser);
      // this.setRefreshTokenCookie(res, refreshToken);

      // return {
      //   access_token: accessToken,
      //   user: safeUser,
      // };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException('Failed to create user');
    }
  }
  async refresh(refreshToken: string, res: Response) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid or Expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password, ...safeUser } = user;
    const newRefreshToken = this.generateRefreshToken(safeUser);
    this.setRefreshTokenCookie(res, newRefreshToken);

    return {
      access_token: this.generateAccessToken(safeUser),
      user: safeUser,
    };
  }
  logout(res: Response) {
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  async googleLogin(profile: any, res: Response) {
    // 1. Check if a user already exists with this googleId (returning Google user)
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      // 2. Check if a normal account exists with the same email (account linking)
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        // 3. Link the Google account to the existing normal account
        try {
          user = await this.prisma.user.update({
            where: { id: existingUser.id },
            data: { googleId: profile.googleId },
          });
        } catch (err: any) {
          if (err.code === 'P2002') {
            throw new ConflictException(
              'Google account already linked to another user',
            );
          }
          throw err;
        }
      } else {
        // 4. No account at all — create a new Google-only user
        try {
          user = await this.prisma.user.create({
            data: {
              email: profile.email,
              username: profile.firstName + ' ' + profile.lastName,
              password: null,
              googleId: profile.googleId,
              emailVerified: true,
            },
          });
        } catch (err: any) {
          if (err.code === 'P2002') {
            throw new ConflictException('Email or Google ID already in use');
          }
          throw err;
        }
      }
    }

    const { password, ...safeUser } = user;
    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = this.generateRefreshToken(safeUser);
    this.setRefreshTokenCookie(res, refreshToken);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }

  async verifyEmail(dto: VerifyOtpDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new BadRequestException('User not found');

    await this.otpService.verifyOtp(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
      dto.code,
    );

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    });

    const { password, ...safeUser } = updatedUser;

    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = this.generateRefreshToken(safeUser);

    this.setRefreshTokenCookie(res, refreshToken);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }

  // inside AuthService

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private setResetTokenCookie(res: Response, token: string) {
    res.cookie('reset_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
  }

  private clearResetTokenCookie(res: Response) {
    res.clearCookie('reset_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const genericResponse = {
      message:
        'If an account exists for that email, a reset code has been sent.',
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return genericResponse;
    }

    const otp = await this.otpService.createOtp(
      user.id,
      OtpPurpose.PASSWORD_RESET,
    );
    await this.mailService.sendOtpEmail(user.email, otp, 'Password Reset');

    return genericResponse;
  }

  async verifyResetOtp(dto: VerifyOtpDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid code');
    }

    await this.otpService.verifyOtp(
      user.id,
      OtpPurpose.PASSWORD_RESET,
      dto.code,
    );

    // Invalidate any previously issued, still-unused reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    this.setResetTokenCookie(res, rawToken);

    return { message: 'Code verified. You may now reset your password.' };
  }

  async resetPassword(dto: ResetPasswordDto, rawToken: string, res: Response) {
    if (!rawToken) {
      throw new UnauthorizedException('Missing reset token');
    }

    const tokenHash = this.hashToken(rawToken);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired reset token');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.clearResetTokenCookie(res);

    return { message: 'Password has been reset successfully.' };
  }
  async resendOtp({ email }: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException(
        'If an account exists for that email, a reset code has been sent.',
      );
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const otp = await this.otpService.createOtp(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    await this.mailService.sendOtpEmail(
      user.email,
      otp,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    return {
      message: 'A new verification code has been sent.',
    };
  }
}
