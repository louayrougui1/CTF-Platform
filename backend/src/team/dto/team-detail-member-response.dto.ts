import { ApiProperty } from '@nestjs/swagger';

export class TeamDetailMemberResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: String, format: 'date-time' })
  joinedAt: Date;
}
