// storage/storage.service.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { randomUUID } from 'crypto';

const BUCKET = 'challengesFiles';
const SIGNED_URL_EXPIRY = 60 * 60 * 4; // 4 hours, in seconds

@Injectable()
export class StorageService {
  constructor(private readonly supabase: SupabaseService) {}

  async upload(
    file: Express.Multer.File,
    folder = 'challenges',
  ): Promise<{ path: string; url: string }> {
    const ext = file.originalname.split('.').pop();
    const path = `${folder}/${randomUUID()}${ext ? '.' + ext : ''}`;

    const { error } = await this.supabase.client.storage
      .from(BUCKET)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new InternalServerErrorException(
        `File upload failed: ${error.message}`,
      );
    }

    const url = await this.getSignedUrl(path);
    return { path, url };
  }

  async getSignedUrl(path: string): Promise<string> {
    const { data, error } = await this.supabase.client.storage
      .from(BUCKET)
      .createSignedUrl(path, SIGNED_URL_EXPIRY);

    if (error) {
      throw new InternalServerErrorException(
        `Failed to sign URL: ${error.message}`,
      );
    }

    return data.signedUrl;
  }

  async delete(path: string): Promise<void> {
    const { error } = await this.supabase.client.storage
      .from(BUCKET)
      .remove([path]);

    if (error) {
      throw new InternalServerErrorException(
        `File deletion failed: ${error.message}`,
      );
    }
  }
}
