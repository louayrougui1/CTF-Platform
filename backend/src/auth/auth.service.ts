import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
  ConflictException,
} from "@nestjs/common";
import { AuthPayloadDto } from "./dto/auth.dto";
import { VerifyOtpDto } from "./dto/verifyOtp.dto";
import { PrismaService } from "../prisma/prisma.service";
import { MailerService } from "./otp/sendEmail";
import { OtpService } from "./otp/otp.service";
import { OtpPurpose } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { JwtService } from "@nestjs/jwt";
import { RegisterDto } from "./dto/register.dto";
import { CookieOptions, Response } from "express";
import { ResendOtpDto } from "./dto/resendOtp.dto";
import { SetPasswordDto } from "./dto/set-password.dto";
import * as crypto from "crypto";
// ...existing imports
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private mailService: MailerService,
    private otpService: OtpService,
  ) {}
  private generateAccessToken(user: any) {
    return this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
      },
      {
        expiresIn: "30m",
      },
    );
  }
  private generateLinkToken(userId: string, googleId: string) {
    return this.jwtService.sign(
      {
        userId: userId,
        googleId: googleId,
      },
      {
        secret: process.env.JWT_LINK_SECRET,
        expiresIn: "5m",
      },
    );
  }
  private setLinkTokenCookie(res: Response, linkToken: string) {
    res.cookie("google_link_token", linkToken, {
      ...this.baseCookieOptions(),
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
  }

  private generateRefreshToken(user: any) {
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is not defined");
    }
    return this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: "7d",
      },
    );
  }

  /**
   * Shared cookie flags for auth cookies.
   * Dev runs same-site (frontend + API both on localhost), so SameSite="lax"
   * is valid there. Production needs SameSite=None + Secure to support a
   * cross-domain hosted frontend. Never use "strict" here.
   */
  private baseCookieOptions(): CookieOptions {
    const production = process.env.NODE_ENV === "production";
    return {
      httpOnly: true,
      secure: production,
      sameSite: production ? "none" : "lax",
    };
  }
  setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie("refresh_token", refreshToken, {
      ...this.baseCookieOptions(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
    });
  }

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private async saveRefreshTokenForUser(userId: string, refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }

  async validateUser({ email, password }: AuthPayloadDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null;
    }

    if (!user.emailVerified) {
      throw new UnauthorizedException(
        "Please verify your email before logging in.",
      );
    }
    if (!user.password) {
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // 2. Login (generate JWT)
  async login(user: any, res: Response) {
    const { password, ...safeUser } = user;
    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = this.generateRefreshToken(safeUser);
    this.setRefreshTokenCookie(res, refreshToken);
    await this.saveRefreshTokenForUser(user.id, refreshToken);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }
  async register({ email, username, password }: RegisterDto, res: Response) {
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      // Check if an account already exists with this email
      const existing = await this.prisma.user.findUnique({ where: { email } });

      let user;

      if (existing) {
        if (existing.password !== null) {
          // Has a password already — genuine duplicate
          throw new BadRequestException("Email already in use");
        }

        // FIX (Issue 1): An account with no password but a linked Google
        // identity is an OAuth-only account. We must NOT silently attach a
        // password to it just because someone submitted this email to
        // /register — that would let an attacker take over the account by
        // simply knowing the victim's Google email address.
        //
        // The rightful owner must first authenticate with Google, then use
        // the authenticated setPassword() flow to add a password.
        if (existing.googleId) {
          throw new ConflictException(
            "An account already exists with this email. Please sign in with Google first.",
          );
        }

        // No password and no googleId is not an expected state for
        // /register to encounter — treat it the same as "email in use"
        // rather than silently repairing it.
        throw new BadRequestException("Email already in use");
      } else {
        // Fresh registration
        try {
          user = await this.prisma.user.create({
            data: { email, username, password: hashedPassword },
          });
        } catch (err: any) {
          if (err.code === "P2002") {
            throw new ConflictException("Email already in use");
          }
          throw err;
        }
      }

      const otp = await this.otpService.createOtp(
        user.id,
        OtpPurpose.EMAIL_VERIFICATION,
      );

      await this.mailService.sendOtpEmail(
        user.email,
        otp,
        OtpPurpose.EMAIL_VERIFICATION,
      );

      return {
        message: "Verification code sent.",
      };
      // const { password, ...safeUser } = user;

      // const accessToken = this.generateAccessToken(safeUser);
      // const refreshToken = this.generateRefreshToken(safeUser);
      // this.setRefreshTokenCookie(res, refreshToken);

      // return {
      //   access_token: accessToken,
      //   user: safeUser,
      // };
    } catch (error: any) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      )
        throw error;
      throw new InternalServerErrorException("Failed to create user");
    }
  }

  /**
   * FIX (Issue 1): Allows a user who owns a Google-only account to add a
   * password to it. This must only be called from a route protected by an
   * auth guard (e.g. JwtAuthGuard), with `userId` taken from the verified
   * access token (req.user.sub) — never from the request body. This is what
   * makes it safe: the caller has already proven ownership of the account
   * via a valid session established through Google login.
   */
  async setPassword(profile: any, { newPassword }: SetPasswordDto) {
    const userId = profile.id;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new BadRequestException("User not found");
    }
    if (user.password) {
      throw new BadRequestException("Password already set for this account.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    const { password, ...safeUser } = updated;
    const accessToken = this.generateAccessToken(safeUser);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }

  async refresh(refreshToken: string, res: Response) {
    let payload: any;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch (error) {
      throw new UnauthorizedException("Invalid or Expired refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    // Ensure the presented refresh token matches the stored hash
    const presentedHash = this.hashToken(refreshToken);
    if (!user.refreshTokenHash || user.refreshTokenHash !== presentedHash) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const { password, ...safeUser } = user;
    const newRefreshToken = this.generateRefreshToken(safeUser);

    // Persist hash of the newly issued refresh token
    await this.saveRefreshTokenForUser(user.id, newRefreshToken);

    this.setRefreshTokenCookie(res, newRefreshToken);

    return {
      access_token: this.generateAccessToken(safeUser),
      user: safeUser,
    };
  }
  async logout(refreshToken: string, res: Response) {
    // Try to clear the stored refresh token hash for the user if possible
    try {
      const payload: any = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      if (payload?.sub) {
        await this.prisma.user.update({
          where: { id: payload.sub },
          data: { refreshTokenHash: null },
        });
      }
    } catch (e) {
      // ignore verification errors; still clear cookie client-side
    }

    res.clearCookie("refresh_token", this.baseCookieOptions());
  }

  async googleLogin(profile: any, res: Response) {
    // 1. Check if a user already exists with this Google ID
    let user = await this.prisma.user.findUnique({
      where: { googleId: profile.googleId },
    });

    if (!user) {
      // 2. Check if an account already exists with this email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: profile.email },
      });

      if (existingUser) {
        // Create a short-lived token specifically for Google linking

        const linkToken = this.generateLinkToken(
          existingUser.id,
          profile.googleId,
        );

        this.setLinkTokenCookie(res, linkToken);
        // Store it in an HTTP-only cookie

        return {
          requiresLinkConfirmation: true,
          message:
            "An account already exists with this email. Would you like to link your Google account to it?",
        };
      }

      // 3. No account exists — create Google-only user
      try {
        user = await this.prisma.user.create({
          data: {
            email: profile.email,
            username: profile.firstName + " " + profile.lastName,
            password: null,
            googleId: profile.googleId,
            emailVerified: true,
          },
        });
      } catch (err: any) {
        if (err.code === "P2002") {
          throw new ConflictException("Email or Google ID already in use");
        }

        throw err;
      }
    }

    // 4. Normal Google login
    const { password, ...safeUser } = user;

    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = this.generateRefreshToken(safeUser);

    this.setRefreshTokenCookie(res, refreshToken);
    await this.saveRefreshTokenForUser(user.id, refreshToken);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }

  async linkGoogleAccount(linkToken: string, res: Response) {
    if (!linkToken) {
      throw new UnauthorizedException(
        "Google link session expired or not found.",
      );
    }

    let payload: {
      userId: string;
      googleId: string;
      purpose: string;
    };

    try {
      payload = this.jwtService.verify(linkToken, {
        secret: process.env.JWT_LINK_SECRET,
      });
    } catch {
      throw new UnauthorizedException(
        "Google link session expired or invalid.",
      );
    }

    const { userId, googleId } = payload;

    // Check if this Google account is already linked
    const googleUser = await this.prisma.user.findUnique({
      where: { googleId },
    });

    if (googleUser && googleUser.id !== userId) {
      throw new ConflictException(
        "This Google account is already linked to another user.",
      );
    }

    // Check the existing user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException("User not found");
    }

    if (user.googleId) {
      throw new BadRequestException(
        "A Google account is already linked to this user.",
      );
    }

    // Actually link Google account
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        googleId,
      },
    });

    res.clearCookie("google_link_token", this.baseCookieOptions());

    const { password, ...safeUser } = updatedUser;

    // Log the user in after successful linking
    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = this.generateRefreshToken(safeUser);

    this.setRefreshTokenCookie(res, refreshToken);
    await this.saveRefreshTokenForUser(updatedUser.id, refreshToken);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }

  async verifyEmail(dto: VerifyOtpDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new BadRequestException("User not found");

    await this.otpService.verifyOtp(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
      dto.code,
    );

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
      },
    });

    const { password, ...safeUser } = updatedUser;

    const accessToken = this.generateAccessToken(safeUser);
    const refreshToken = this.generateRefreshToken(safeUser);

    this.setRefreshTokenCookie(res, refreshToken);
    await this.saveRefreshTokenForUser(updatedUser.id, refreshToken);

    return {
      access_token: accessToken,
      user: safeUser,
    };
  }

  // inside AuthService

  private setResetTokenCookie(res: Response, token: string) {
    res.cookie("reset_token", token, {
      ...this.baseCookieOptions(),
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
  }

  private clearResetTokenCookie(res: Response) {
    res.clearCookie("reset_token", this.baseCookieOptions());
  }

  async forgotPassword({ email }: ForgotPasswordDto) {
    const genericResponse = {
      message:
        "If an account exists for that email, a reset code has been sent.",
    };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return genericResponse;
    }

    const otp = await this.otpService.createOtp(
      user.id,
      OtpPurpose.PASSWORD_RESET,
    );
    await this.mailService.sendOtpEmail(user.email, otp, "Password Reset");

    return genericResponse;
  }

  async verifyResetOtp(dto: VerifyOtpDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException("Invalid code");
    }

    await this.otpService.verifyOtp(
      user.id,
      OtpPurpose.PASSWORD_RESET,
      dto.code,
    );

    // Invalidate any previously issued, still-unused reset tokens for this user
    await this.prisma.passwordResetToken.deleteMany({
      where: { userId: user.id, usedAt: null },
    });

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = this.hashToken(rawToken);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    this.setResetTokenCookie(res, rawToken);

    return { message: "Code verified. You may now reset your password." };
  }

  async resetPassword(dto: ResetPasswordDto, rawToken: string, res: Response) {
    if (!rawToken) {
      throw new UnauthorizedException("Missing reset token");
    }

    const tokenHash = this.hashToken(rawToken);

    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new UnauthorizedException("Invalid or expired reset token");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    this.clearResetTokenCookie(res);

    return { message: "Password has been reset successfully." };
  }
  async resendOtp({ email }: ResendOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException(
        "If an account exists for that email, a reset code has been sent.",
      );
    }

    if (user.emailVerified) {
      throw new BadRequestException("Email is already verified");
    }

    const otp = await this.otpService.createOtp(
      user.id,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    await this.mailService.sendOtpEmail(
      user.email,
      otp,
      OtpPurpose.EMAIL_VERIFICATION,
    );

    return {
      message: "A new verification code has been sent.",
    };
  }
}
