import { IsEmail, IsString, MinLength, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
@ApiProperty()
export class RegisterDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  username: string;

  @ApiProperty()
  @IsString()
  @Length(6, 200)
  password: string;
}
