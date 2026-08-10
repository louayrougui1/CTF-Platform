import { ApiProperty } from '@nestjs/swagger';

export class TeamUpdateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  eventId: string;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
