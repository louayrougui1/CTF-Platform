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
  async login(user: any) {
    const { password, ...safeUser } = user;
    console.log('Logging in user:', safeUser); // Debugging log
    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = this.generateRefreshToken(safeUser);
    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user: safeUser,
    };
  }
  async register({ email, username, password }: RegisterDto) {
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
  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const { password, ...safeUser } = user;

      return {
        access_token: this.generateAccessToken(safeUser),
        refresh_token: this.generateRefreshToken(safeUser),
        user: safeUser,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or Expired refresh token');
    }
  }
}
