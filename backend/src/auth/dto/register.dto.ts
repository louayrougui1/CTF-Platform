import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @Length(3, 30)
  username: string;

  @ApiProperty()
  @IsString()
  @Length(6, 200)
  password: string;
}
