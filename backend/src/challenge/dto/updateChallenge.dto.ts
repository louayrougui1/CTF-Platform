import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UpdateChallengeDto {
  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  description: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  flag: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;
}
