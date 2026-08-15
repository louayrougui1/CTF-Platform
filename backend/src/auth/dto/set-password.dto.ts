import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class SetPasswordDto {
  @ApiProperty()
  @IsString()
  @Length(6, 200)
  newPassword: string;
}
