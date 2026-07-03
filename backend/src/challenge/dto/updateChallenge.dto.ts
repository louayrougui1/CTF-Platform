import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  IsOptional,
  MaxLength,
} from 'class-validator';

export class UpdateChallengeDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  description: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  flag: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;
}
