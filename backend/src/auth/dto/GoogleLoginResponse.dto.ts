// dto/forgotPassword.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class GoogleLoginResponseDto {
  @ApiProperty()
  requiresLinkConfirmation: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  googleId: string;
}
