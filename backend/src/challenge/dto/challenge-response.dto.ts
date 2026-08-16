import { ApiProperty } from '@nestjs/swagger';
import { ChallengeCategory, ChallengeDifficulty } from '@prisma/client';

export class ChallengeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  points: number;

  @ApiProperty({ enum: ChallengeCategory })
  category: ChallengeCategory;

  @ApiProperty({ enum: ChallengeDifficulty })
  difficulty: ChallengeDifficulty;

  @ApiProperty()
  eventId: string;

  @ApiProperty({ type: Boolean })
  solved: boolean;

  @ApiProperty({ type: Boolean })
  hasFile: boolean;

  @ApiProperty({ nullable: true })
  fileUrl: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
