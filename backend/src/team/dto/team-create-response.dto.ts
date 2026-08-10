import { ApiProperty } from '@nestjs/swagger';

class TeamCreateMemberResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  role: string;
}

export class TeamCreateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: () => TeamCreateMemberResponseDto, isArray: true })
  members: TeamCreateMemberResponseDto[];
}
