// local.strategy.ts
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { AuthPayloadDto } from '../dto/auth.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private authService: AuthService) {
    super({ usernameField: 'email' }); // important
  }

  async validate(email: string, password: string) {
    const dto = plainToInstance(AuthPayloadDto, {
      email,
      password,
    });

    const errors = await validate(dto);

    if (errors.length > 0) {
      throw new BadRequestException(errors);
    }

    const user = await this.authService.validateUser(dto);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return user; // becomes req.user
  }
}
