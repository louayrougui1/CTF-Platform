import { Test, TestingModule } from '@nestjs/testing';
import { TeamService } from './team.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TeamService', () => {
  let service: TeamService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamService,
        {
          provide: PrismaService,
          useValue: {
            challenge: { count: jest.fn() },
            event: { findUnique: jest.fn(), findUniqueOrThrow: jest.fn() },
            eventMember: {
              count: jest.fn(),
              findUnique: jest.fn(),
              updateMany: jest.fn(),
            },
            submission: { count: jest.fn(), deleteMany: jest.fn() },
            team: {
              count: jest.fn(),
              create: jest.fn(),
              delete: jest.fn(),
              findFirst: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            teamMember: {
              create: jest.fn(),
              delete: jest.fn(),
              findFirst: jest.fn(),
              update: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<TeamService>(TeamService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
