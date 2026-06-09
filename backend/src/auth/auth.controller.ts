import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalGuard } from './guards/local.guard';
import { JwtGuard } from './guards/jwt.guard';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalGuard)
  login(@Request() req) {
    return this.authService.login(req.user);
  }
  @UseGuards(JwtGuard)
  @Get('profile')
  getProfile(@Request() req) {
    console.log('inside authcontroller status controller');
    console.log(req.user);
    return req.user;
  }
}
