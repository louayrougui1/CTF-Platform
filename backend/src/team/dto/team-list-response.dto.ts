import { ApiProperty } from '@nestjs/swagger';
import { TeamListMemberResponseDto } from './team-list-member-response.dto';

export class TeamListResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty({ type: () => TeamListMemberResponseDto, isArray: true })
  members: TeamListMemberResponseDto[];
}