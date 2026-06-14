import { IsString, IsUUID } from 'class-validator';

export class AddAdminDto {
  @IsString()
  @IsUUID()
  eventId: string;

  @IsString()
  @IsUUID()
  userIdToPromote: string;
}
