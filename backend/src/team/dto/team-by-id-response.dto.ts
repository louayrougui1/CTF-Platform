import { ApiProperty } from '@nestjs/swagger';
import { TeamMembersResponseDto } from './team-members-response.dto';

export class TeamByIdResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: () => TeamMembersResponseDto, isArray: true })
  members: TeamMembersResponseDto[];
}
