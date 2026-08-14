import { ApiProperty } from '@nestjs/swagger';

export class ChallengeStatsResponseDto {
  @ApiProperty()
  solveCount: number;
}
