import { Controller } from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { Get } from '@nestjs/common';
import { JwtGuard } from '../auth/guards/jwt.guard';
import { Request } from '@nestjs/common';
import { UserService } from './user.service';
@UseGuards(JwtGuard)
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('profile')
  getProfile(@Request() req) {
    return this.userService.getProfile(req.user);
  }
}
