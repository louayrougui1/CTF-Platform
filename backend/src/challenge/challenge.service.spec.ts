import { Test, TestingModule } from '@nestjs/testing';
import { ChallengeService } from './challenge.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

describe('ChallengeService', () => {
  let service: ChallengeService;
  let prisma: {
    challenge: {
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
    event: {
      findUnique: jest.Mock;
    };
  };
  let storage: { delete: jest.Mock };

  beforeEach(async () => {
    prisma = {
      challenge: {
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
      event: {
        findUnique: jest.fn().mockResolvedValue({
          ownerId: 'user-1',
          members: [],
        }),
      },
    };
    storage = {
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChallengeService,
        { provide: PrismaService, useValue: prisma },
        { provide: StorageService, useValue: storage },
      ],
    }).compile();

    service = module.get<ChallengeService>(ChallengeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('deleteChallenge', () => {
    it('deletes the stored file before removing the challenge', async () => {
      prisma.challenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        eventId: 'event-1',
        hasFile: true,
        fileUrl: 'challenges/abc.txt',
      });
      prisma.challenge.delete.mockResolvedValue({ id: 'challenge-1' });

      await service.deleteChallenge({ id: 'user-1' }, 'challenge-1');

      expect(storage.delete).toHaveBeenCalledWith('challenges/abc.txt');
      expect(prisma.challenge.delete).toHaveBeenCalled();
    });

    it('does not touch storage when the challenge has no file', async () => {
      prisma.challenge.findUnique.mockResolvedValue({
        id: 'challenge-1',
        eventId: 'event-1',
        hasFile: false,
        fileUrl: null,
      });
      prisma.challenge.delete.mockResolvedValue({ id: 'challenge-1' });

      await service.deleteChallenge({ id: 'user-1' }, 'challenge-1');

      expect(storage.delete).not.toHaveBeenCalled();
      expect(prisma.challenge.delete).toHaveBeenCalled();
    });
  });
});