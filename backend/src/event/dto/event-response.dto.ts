import { ApiProperty } from '@nestjs/swagger';

export class EventResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ nullable: true })
  description: string | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  startDate: Date | null;

  @ApiProperty({ type: String, format: 'date-time', nullable: true })
  endDate: Date | null;

  @ApiProperty({ type: Boolean })
  isPublic: boolean;

  @ApiProperty({ nullable: true })
  inviteCode: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
