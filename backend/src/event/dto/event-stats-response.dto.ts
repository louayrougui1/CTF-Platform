import { ApiProperty } from '@nestjs/swagger';

export class EventStatsResponseDto {
  @ApiProperty()
  memberCount: number;

  @ApiProperty()
  teamCount: number;

  @ApiProperty()
  challengeCount: number;

  @ApiProperty()
  solveCount: number;
}
