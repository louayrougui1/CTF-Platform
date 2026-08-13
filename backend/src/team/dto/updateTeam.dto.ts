import { IsString, Length, IsOptional } from 'class-validator';

export class UpdateTeamDto {
  @IsString()
  @Length(1, 50)
  name: string;
}
