import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID } from 'class-validator';

export class RemoveAdminDto {
  @ApiProperty()
  @IsString()
  @IsUUID()
  eventId: string;

  @ApiProperty()
  @IsString()
  @IsUUID()
  userIdToRemove: string;
}
