import { Test, TestingModule } from '@nestjs/testing';
import { EventService } from './event.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let service: EventService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventService,
        {
          provide: PrismaService,
          useValue: {
            challenge: { count: jest.fn() },
            event: {
              create: jest.fn(),
              delete: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              findUniqueOrThrow: jest.fn(),
              update: jest.fn(),
            },
            eventMember: { count: jest.fn(), create: jest.fn(), findUnique: jest.fn() },
            submission: { count: jest.fn() },
            team: { count: jest.fn(), create: jest.fn() },
          },
        },
      ],
    }).compile();

    service = module.get<EventService>(EventService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
