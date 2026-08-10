import { ApiProperty } from '@nestjs/swagger';

export class TeamMessageResponseDto {
  @ApiProperty()
  message: string;
}
