import { IsEmail, IsString, MinLength, Length } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  username: string;

  @IsString()
  @Length(6, 200)
  password: string;
}
