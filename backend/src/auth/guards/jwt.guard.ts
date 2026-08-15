import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

@Injectable()
export class JwtGuard extends AuthGuard('jwt') {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    console.log('JWT guard hit...');
    const request = context.switchToHttp().getRequest();

    console.log('JWT GUARD:', {
      method: request.method,
      url: request.url,
      authorization: request.headers.authorization,
    });

    return super.canActivate(context);
  }
}
