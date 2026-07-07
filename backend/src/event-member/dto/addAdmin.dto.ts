import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class AddAdminDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  eventId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  userIdToPromote: string;
}
