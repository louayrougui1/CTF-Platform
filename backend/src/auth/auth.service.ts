import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { PrismaService } from '../prisma/prisma.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
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
      const newUser = await this.prisma.user.create({
        data: {
          email,
          username,
          password: hashedPassword,
        },
      });

      const { password, ...safeUser } = newUser;
      console.log('New user created:', safeUser); // Debugging log
      const accessToken = this.generateAccessToken(safeUser);
      const refreshToken = this.generateRefreshToken(safeUser);
      this.setRefreshTokenCookie(res, refreshToken);

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        user: safeUser,
      };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Email or username already in use');
      }

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
      where: { id: payload!.sub },
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
}
