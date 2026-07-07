import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';

export class UpdateTeamDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  @IsOptional()
  name?: string;
}
