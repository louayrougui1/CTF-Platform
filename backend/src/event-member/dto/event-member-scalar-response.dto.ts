import { ApiProperty } from '@nestjs/swagger';

export class EventMemberScalarResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  eventId: string;
}
