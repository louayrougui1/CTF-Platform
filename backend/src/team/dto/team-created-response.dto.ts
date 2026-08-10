import { ApiProperty } from '@nestjs/swagger';
import { TeamDetailMemberResponseDto } from './team-detail-member-response.dto';

export class TeamCreatedResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: () => TeamDetailMemberResponseDto, isArray: true })
  members: TeamDetailMemberResponseDto[];
}
