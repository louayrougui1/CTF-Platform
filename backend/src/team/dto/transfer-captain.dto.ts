import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class TransferCaptainDto {
  @ApiProperty({ description: 'User ID of the member to promote to captain' })
  @IsNotEmpty()
  @IsString()
  userIdToPromote: string;
}
