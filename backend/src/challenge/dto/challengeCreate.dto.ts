import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  Length,
  IsEnum,
} from "class-validator";
import { ChallengeCategory, ChallengeDifficulty } from "@prisma/client";

export class CreateChallengeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(1, 120)
  description: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @Length(5, 120)
  flag: string;

  @ApiProperty({ enum: ChallengeCategory })
  @IsEnum(ChallengeCategory)
  category: ChallengeCategory;

  @ApiProperty({ enum: ChallengeDifficulty })
  @IsEnum(ChallengeDifficulty)
  difficulty: ChallengeDifficulty;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  points?: number;
}
