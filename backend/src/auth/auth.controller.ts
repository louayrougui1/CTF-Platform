import {
  Controller,
  Post,
  UseGuards,
  Body,
  Res,
  Req,
  UnauthorizedException,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalGuard } from './guards/local.guard';
import { RegisterDto } from './dto/register.dto';
import type { Response, Request } from 'express';
import { GoogleAuthGuard } from './guards/google.guard';
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalGuard)
  login(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(req.user, res);
  }

  @Post('register')
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, res);
  }

  @Post('refresh')
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    return this.authService.refresh(refreshToken, res);
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    this.authService.logout(res);
    return { message: 'Logged out' };
  }

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    console.log('Google callback route hit...');
    const result = await this.authService.googleLogin(req.user, res);

    // Redirect to frontend with the access token in the query string
    // (or POST it via a form — depends on your frontend flow)
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    res.redirect(`${frontendUrl}/?token=${result.access_token}`);
  }
}
