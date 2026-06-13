import { Controller, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UserService } from './user.service';
import type { Request } from 'express';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  getProfile(@Req() req: Request) {
    return this.userService.getProfile(req.user);
  }
}
