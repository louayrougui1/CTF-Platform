import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class SubmissionThrottlerGuard extends ThrottlerGuard {
  protected errorMessage =
    'Too many submissions. Please wait a moment and try again.';

  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.user?.id ? `user:${req.user.id}` : req.ip;
  }
}
