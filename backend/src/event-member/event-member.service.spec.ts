import { Test, TestingModule } from '@nestjs/testing';
import { EventMemberService } from './event-member.service';

describe('EventMemberService', () => {
  let service: EventMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventMemberService],
    }).compile();

    service = module.get<EventMemberService>(EventMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
