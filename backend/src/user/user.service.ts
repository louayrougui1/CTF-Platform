import { Get, Injectable, NotFoundException, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtGuard } from '../auth/guards/jwt.guard';
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  @UseGuards(JwtGuard)
  @Get()
  async getProfile(user: any) {
    return user;
  }
}
