import { ApiProperty } from '@nestjs/swagger';

export class TeamListUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;
}

export class TeamListMemberResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: () => TeamListUserResponseDto })
  user: TeamListUserResponseDto;
}