import { ApiProperty } from '@nestjs/swagger';

export class EventMemberUserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  email: string;
}
