import { ApiProperty } from '@nestjs/swagger';

export class ChallengeStatsResponseDto {
  @ApiProperty()
  submissionCount: number;

  @ApiProperty()
  solveCount: number;
}
