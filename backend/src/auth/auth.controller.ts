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
import { GoogleLoginResponseDto } from './dto/GoogleLoginResponse.dto';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AuthMessageResponseDto } from './dto/auth-message-response.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { SetPasswordDto } from './dto/set-password.dto';
import { JwtGuard } from './guards/jwt.guard';

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

  @Post('set-password')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ type: AuthResponseDto })
  setPassword(@Body() dto: SetPasswordDto, @Req() req: Request) {
    return this.authService.setPassword(req.user, dto);
  }

  @ApiCookieAuth('refresh_token')
  @Post('refresh')
  @ApiCreatedResponse({ type: AuthResponseDto })
  refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) throw new UnauthorizedException('No refresh token');
    return this.authService.refresh(refreshToken, res);
  }

  @ApiCookieAuth('refresh_token')
  @Post('logout')
  @ApiCreatedResponse({ type: AuthMessageResponseDto })
  logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.['refresh_token'];
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
    description:
      'If login succeeds, redirect to the frontend with the access token in the URL.If the account requires Google linking confirmation, redirect to the frontend link-confirmation page and set the google_link_token cookie. The frontend must send this cookie when calling POST /auth/google/link.',
  })
  async googleCallback(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.googleLogin(req.user, res);

    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';

    // Existing account — ask frontend for confirmation
    if (result.requiresLinkConfirmation) {
      return res.redirect(`${frontendUrl}/google/link-confirmation`);
    }

    // Normal Google login
    return res.redirect(
      `${frontendUrl}/?token=${encodeURIComponent(result.access_token!)}`,
    );
  }

  @ApiCookieAuth('google_link_token')
  @Post('google/link')
  @ApiOperation({
    summary: 'Confirm and link Google account',
  })
  async linkGoogleAccount(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const linkToken = req.cookies?.['google_link_token'];

    return this.authService.linkGoogleAccount(linkToken, res);
  }

  @Post('forgot-password')
  @ApiCreatedResponse({ type: AuthMessageResponseDto })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Post('verify-reset-otp')
  @ApiCreatedResponse({ type: AuthMessageResponseDto })
  verifyResetOtp(
    @Body() dto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.verifyResetOtp(dto, res);
  }

  @ApiCookieAuth('reset_token')
  @Post('reset-password')
  @ApiCreatedResponse({ type: AuthMessageResponseDto })
  resetPassword(
    @Body() dto: ResetPasswordDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const resetToken = req.cookies?.['reset_token'];
    if (!resetToken) throw new UnauthorizedException('No reset token');
    return this.authService.resetPassword(dto, resetToken, res);
  }
}
