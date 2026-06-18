import { IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class JoinTeamDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @MinLength(5)
  password: string;
}
