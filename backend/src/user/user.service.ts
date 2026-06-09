import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  async getProfile(user: any) {
    const { password, ...safeUser } = user;
    return safeUser;
  }
}
