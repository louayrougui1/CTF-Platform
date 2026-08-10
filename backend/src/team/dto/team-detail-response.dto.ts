import { ApiProperty } from '@nestjs/swagger';
import { TeamDetailMemberResponseDto } from './team-detail-member-response.dto';

export class TeamDetailResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: () => TeamDetailMemberResponseDto, isArray: true })
  members: TeamDetailMemberResponseDto[];
}
