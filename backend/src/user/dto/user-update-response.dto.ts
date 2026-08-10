import { ApiProperty } from '@nestjs/swagger';

export class UserUpdateResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ nullable: true })
  googleId: string | null;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt: Date;
}
