import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { SubmissionThrottlerGuard } from './guards/submission-throttler.guard';

describe('ChallengeController', () => {
  let controller: ChallengeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ChallengeController],
      providers: [{ provide: ChallengeService, useValue: {} }],
    })
      // ThrottlerGuard injects THROTTLER:MODULE_OPTIONS, which only exists when
      // ThrottlerModule.forRoot() is registered in the app module.
      .overrideGuard(SubmissionThrottlerGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ChallengeController>(ChallengeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
