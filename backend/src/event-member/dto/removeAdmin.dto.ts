import { IsString, IsUUID } from 'class-validator';

export class RemoveAdminDto {
  @IsString()
  @IsUUID()
  eventId: string;

  @IsString()
  @IsUUID()
  userIdToRemove: string;
}
