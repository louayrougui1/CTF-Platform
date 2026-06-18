import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/updateUser.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(reqUser: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: reqUser.id },
      select: {
        id: true,
        email: true,
        username: true,
        googleId: true,
        password: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...safeUser } = user;

    return {
      ...safeUser,
      hasPassword: password !== null,
    };
  }

  async updateProfile(reqUser: any, UpdateUserDto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: reqUser.id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Username unchanged
    if (UpdateUserDto.username && UpdateUserDto.username === user.username) {
      throw new BadRequestException(
        'New username must be different from current username',
      );
    }

    // Allow update only once every 2 minutes
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    if (user.updatedAt > twoMinutesAgo) {
      const remainingSeconds = Math.ceil(
        (user.updatedAt.getTime() + 2 * 60 * 1000 - Date.now()) / 1000,
      );

      throw new BadRequestException(
        `You can update your profile again in ${remainingSeconds} seconds`,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: reqUser.id },
      data: {
        username: UpdateUserDto.username,
      },
      select: {
        id: true,
        email: true,
        username: true,
        googleId: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }
}
