import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendOtpDto {
  @IsEmail()
  @ApiProperty()
  email: string;
}
