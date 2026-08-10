import { ApiProperty } from '@nestjs/swagger';
import { AuthUserResponseDto } from './auth-user-response.dto';

export class AuthResponseDto {
  @ApiProperty()
  access_token: string;

  @ApiProperty({ type: () => AuthUserResponseDto })
  user: AuthUserResponseDto;
}
