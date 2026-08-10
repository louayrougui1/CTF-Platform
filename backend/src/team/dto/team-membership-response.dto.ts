import { ApiProperty } from '@nestjs/swagger';

export class TeamMembershipResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  teamId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
