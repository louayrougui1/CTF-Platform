import { Test, TestingModule } from '@nestjs/testing';
import { EventMemberController } from './event-member.controller';

describe('EventMemberController', () => {
  let controller: EventMemberController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventMemberController],
    }).compile();

    controller = module.get<EventMemberController>(EventMemberController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
