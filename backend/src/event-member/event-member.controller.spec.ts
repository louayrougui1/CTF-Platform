import { Test, TestingModule } from '@nestjs/testing';
import { EventMemberController } from './event-member.controller';
import { EventMemberService } from './event-member.service';

describe('EventMemberController', () => {
  let controller: EventMemberController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventMemberController],
      providers: [{ provide: EventMemberService, useValue: {} }],
    }).compile();

    controller = module.get<EventMemberController>(EventMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
