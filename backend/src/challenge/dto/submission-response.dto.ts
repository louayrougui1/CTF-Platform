import { ApiProperty } from '@nestjs/swagger';

export class SubmissionResponseDto {
  @ApiProperty()
  status: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;
}
