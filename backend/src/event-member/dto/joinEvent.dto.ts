import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinEventDto {
  @ApiProperty({
    description: 'Invite code, required to join a private event',
  })
  @IsNotEmpty()
  @IsString()
  inviteCode: string;
}