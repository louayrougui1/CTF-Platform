import { ApiProperty } from '@nestjs/swagger';
import { EventMemberUserResponseDto } from './event-member-user-response.dto';

export class EventMemberResponseDto {
  @ApiProperty()
  role: string;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ type: () => EventMemberUserResponseDto })
  user: EventMemberUserResponseDto;
}
