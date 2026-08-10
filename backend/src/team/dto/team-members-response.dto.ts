import { ApiProperty } from '@nestjs/swagger';

export class TeamMembersResponseDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: string;
}
