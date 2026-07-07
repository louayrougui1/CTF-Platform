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
  @IsOptional()
  title?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  @IsOptional()
  flag?: string;

  @ApiPropertyOptional()
  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;
}
