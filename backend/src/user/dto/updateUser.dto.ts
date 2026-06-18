// dto/update-profile.dto.ts
import { IsOptional, IsString, Length } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @Length(3, 20)
  username: string;
}
