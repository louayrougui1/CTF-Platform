import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventMemberService } from './event-member.service';
import { Event } from '@prisma/client';

const prismaMock = () => ({
  event: {
    findUnique: jest.fn(),
  },
  eventMember: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findMany: jest.fn(),
  },
});

describe('EventMemberService', () => {
  let service: EventMemberService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EventMemberService,
        { provide: PrismaService, useValue: prismaMock() },
      ],
    }).compile();

    service = module.get<EventMemberService>(EventMemberService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('joinEventByCode', () => {
    it('throws NotFoundException when no event matches the invite code', async () => {
      const prisma = service['prisma'] as ReturnType<typeof prismaMock>;
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.joinEventByCode({ id: 'user' }, { inviteCode: 'ABC12345' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('joins by resolving the event from its invite code', async () => {
      const prisma = service['prisma'] as ReturnType<typeof prismaMock>;
      const event = { id: 'evt', inviteCode: 'ABC12345' } as Event;
      const membership = { userId: 'user', eventId: 'evt', role: 'MEMBER' };

      prisma.event.findUnique.mockResolvedValue(event);
      prisma.eventMember.create.mockResolvedValue(membership);

      await expect(
        service.joinEventByCode({ id: 'user' }, { inviteCode: 'ABC12345' }),
      ).resolves.toEqual(membership);

      expect(prisma.event.findUnique).toHaveBeenCalledWith({
        where: { inviteCode: 'ABC12345' },
      });
      expect(prisma.eventMember.create).toHaveBeenCalledWith({
        data: { userId: 'user', eventId: 'evt', role: 'MEMBER' },
      });
    });
  });
});
