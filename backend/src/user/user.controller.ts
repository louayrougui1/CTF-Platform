import { Controller, Req } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Get, Patch, Body } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { UserService } from './user.service';
import type { Request } from 'express';
import { UpdateUserDto } from './dto/updateUser.dto';

@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  getProfile(@Req() req: Request) {
    return this.userService.getProfile(req.user);
  }

  @Patch('profile')
  updateProfile(@Req() req, @Body() updateProfileDto: UpdateUserDto) {
    return this.userService.updateProfile(req.user, updateProfileDto);
  }
}
