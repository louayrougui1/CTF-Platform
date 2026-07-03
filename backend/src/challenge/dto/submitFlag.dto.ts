import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SubmitFlagDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(256)
  flag: string;
}
