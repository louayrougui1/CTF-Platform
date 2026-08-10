// storage/storage.module.ts
import { Module, Global } from '@nestjs/common';
import { StorageService } from './storage.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Global()
@Module({
  imports: [SupabaseModule],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
