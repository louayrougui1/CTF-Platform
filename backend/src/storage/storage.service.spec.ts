import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from './storage.service';
import { SupabaseService } from '../supabase/supabase.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: SupabaseService,
          useValue: {
            client: {},
            getSignedUrl: jest.fn(),
            upload: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
