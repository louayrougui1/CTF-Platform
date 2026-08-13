import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  Min,
  IsOptional,
  Length,
  IsEnum,
} from 'class-validator';
import { ChallengeCategory, ChallengeDifficulty } from '@prisma/client';

export class UpdateChallengeDto {
  @ApiPropertyOptional()
  @IsString()
  @Length(1, 120)
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @Length(1, 120)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @Length(1, 120)
  @IsOptional()
  flag?: string;

  @ApiPropertyOptional({ enum: ChallengeCategory })
  @IsOptional()
  @IsEnum(ChallengeCategory)
  category?: ChallengeCategory;

  @ApiPropertyOptional({ enum: ChallengeDifficulty })
  @IsOptional()
  @IsEnum(ChallengeDifficulty)
  difficulty?: ChallengeDifficulty;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;
}
