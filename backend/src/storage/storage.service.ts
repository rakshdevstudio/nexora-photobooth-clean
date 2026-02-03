import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    private supabase: SupabaseClient;
    private bucketName = process.env.SUPABASE_BUCKET || 'photos';

    constructor() {
        // STRICT CONFIGURATION: Network Isolation & Server-Side Security
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            this.logger.error('CRITICAL: Supabase credentials missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY).');
            // We log error but don't throw in constructor to allow app to boot (though functionality will break)
        }

        // Optimize for server-side usage: disable session persistence and auto-refresh
        this.supabase = createClient(supabaseUrl || '', supabaseKey || '', {
            auth: {
                persistSession: false,
                autoRefreshToken: false,
                detectSessionInUrl: false,
            },
        });
    }

    // NOTE: OnModuleInit removed to prevent ANY network calls during startup.
    // The backend should not attempt to connect to Supabase until a request is made.

    async getSignedUploadUrl(path: string): Promise<{ signedUrl: string; token: string; path: string; downloadUrl: string }> {
        // The backend ONLY generates a signed URL. The frontend uploads the file directly.
        // This bypasses Railway DNS issues completely for the upload traffic.
        const { data, error } = await this.supabase.storage
            .from(this.bucketName)
            .createSignedUploadUrl(path);

        if (error) {
            this.logger.error(`Failed to generate signed upload URL: ${error.message}`);
            throw new InternalServerErrorException('Failed to generate upload URL');
        }

        // Generate a read-only signed URL for the frontend to display the QR code
        const { data: readData, error: readError } = await this.supabase.storage
            .from(this.bucketName)
            .createSignedUrl(path, 3600); // 1 hour validity

        if (readError) {
            this.logger.error(`Failed to generate signed read URL: ${readError.message}`);
            // We don't fail the upload flow if read URL fails, but it's bad.
        }

        return {
            signedUrl: data.signedUrl,
            token: data.token,
            path: data.path,
            downloadUrl: readData?.signedUrl || '',
        };
    }

    // DEPRECATED: Direct backend uploads are disabled
    async uploadPhoto(_file: Buffer, _filename: string): Promise<string> {
        throw new InternalServerErrorException('Backend uploads are disabled. Use signed-url flow.');
    }
}
