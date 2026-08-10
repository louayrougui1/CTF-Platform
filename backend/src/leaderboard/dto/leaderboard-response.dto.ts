import { ApiProperty } from '@nestjs/swagger';

export class LeaderboardResponseDto {
  @ApiProperty()
  teamId: string;

  @ApiProperty()
  teamName: string;

  @ApiProperty()
  score: number;
}
