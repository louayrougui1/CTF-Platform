import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class JoinEventDto {
  @ApiPropertyOptional({
    description: 'Invite code, required to join a private event',
  })
  @IsOptional()
  @IsString()
  inviteCode?: string;
}