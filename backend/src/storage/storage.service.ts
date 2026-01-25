import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
    private supabase: SupabaseClient;
    private bucketName = process.env.SUPABASE_BUCKET || 'photos';

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn('Supabase credentials not found in environment variables.');
        }

        this.supabase = createClient(supabaseUrl || '', supabaseKey || '');
    }

    async uploadPhoto(file: Buffer, filename: string): Promise<string> {
        const path = `kiosk/${uuidv4()}-${filename}`;

        const { error } = await this.supabase.storage
            .from(this.bucketName)
            .upload(path, file, {
                contentType: 'image/png',
                upsert: false,
            });

        if (error) {
            console.error('Supabase Upload Error:', error);
            throw new InternalServerErrorException('Failed to upload photo');
        }

        const { data, error: signedUrlError } = await this.supabase.storage
            .from(this.bucketName)
            .createSignedUrl(path, 900);

        if (signedUrlError) {
            console.error('Signed URL Error:', signedUrlError);
            throw new InternalServerErrorException('Failed to generate signed URL');
        }

        return data.signedUrl;
    }
}
