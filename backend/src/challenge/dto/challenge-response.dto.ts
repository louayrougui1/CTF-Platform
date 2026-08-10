import { ApiProperty } from '@nestjs/swagger';

export class ChallengeResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  points: number;

  @ApiProperty()
  eventId: string;

  @ApiProperty({ type: Boolean })
  hasFile: boolean;

  @ApiProperty({ nullable: true })
  fileUrl: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
