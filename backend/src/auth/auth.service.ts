import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
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
        expiresIn: '30m',
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
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // 2. Login (generate JWT)
  async login(user: any, res: Response) {
    const { password, ...safeUser } = user;
    console.log('Logging in user:', safeUser); // Debugging log
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
        user = await this.prisma.user.create({
          data: { email, username, password: hashedPassword },
        });
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
      if (error instanceof BadRequestException) throw error;
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
    this.setRefreshTokenCookie(res, refreshToken);

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
        user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: { googleId: profile.googleId },
        });
      } else {
        // 4. No account at all — create a new Google-only user
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            username: profile.firstName + ' ' + profile.lastName,
            password: null,
            googleId: profile.googleId,
            emailVerified: true,
          },
        });
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
  async resendOtp({ email }: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
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
