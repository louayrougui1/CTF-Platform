import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, Length } from 'class-validator';

export class JoinTeamDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(4, 100)
  password: string;
}
