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
import { VerifyOtpDto } from './dto/verifyOtp.dto';
import type { Response, Request } from 'express';
import { GoogleAuthGuard } from './guards/google.guard';
import { ResendOtpDto } from './dto/resendOtp.dto';
import { AuthPayloadDto } from './dto/auth.dto';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
} from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthMessageResponseDto } from './dto/auth-message-response.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalGuard)
  @ApiCreatedResponse({ type: AuthResponseDto })
  login(
    @Body() dto: AuthPayloadDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(req.user, res);
  }

  @Post('verify-email')
  @ApiCreatedResponse({ type: AuthResponseDto })
  verifyEmail(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyEmail(dto, res);
  }

  @Post('resend-otp')
  @ApiCreatedResponse({ type: AuthMessageResponseDto })
  resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto);
  }

  @Post('register')
  @ApiCreatedResponse({ type: AuthMessageResponseDto })
  register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.register(dto, res);
  }

  @ApiCookieAuth('refresh_token')
  @Post('refresh')
  @ApiCreatedResponse({ type: AuthResponseDto })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    return this.authService.refresh(refreshToken, res);
  }

  @ApiCookieAuth('refresh_token')
  @Post('logout')
  @ApiCreatedResponse({ type: AuthMessageResponseDto })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    this.authService.logout(res);
    return { message: 'Logged out' };
  }

  @Get('google/login')
  @UseGuards(GoogleAuthGuard)
  googleLogin(@Req() req: Request) {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({
    summary: 'Google OAuth callback',
    description: 'Redirects to frontend with token in URL query parameter',
  })
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
