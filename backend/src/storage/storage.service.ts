import { Injectable, InternalServerErrorException, OnModuleInit, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService implements OnModuleInit {
    private readonly logger = new Logger(StorageService.name);
    private supabase: SupabaseClient;
    private bucketName = process.env.SUPABASE_BUCKET || 'photos';

    constructor() {
        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            this.logger.warn('Supabase credentials not found in environment variables.');
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

    async onModuleInit() {
        try {
            this.logger.log('Validating Supabase connection...');
            // Simple check: Try to list buckets (or just verify the client can reach the server)
            // Even a simple listBuckets call will fail if the URL is invalid/unreachable.
            const { error } = await this.supabase.storage.listBuckets();

            if (error) {
                // If it's a connection error (like ENOTFOUND), it will catch below usually, 
                // but if Supabase returns an API error, we handle it here.
                throw new Error(`Supabase API Error: ${error.message}`);
            }

            this.logger.log('Supabase connection validated successfully.');
        } catch (error: any) {
            // SOFT VALIDATION: Log error but do NOT crash the app.
            // This allows the app to start even if Supabase is temporarily unreachable.
            this.logger.error(`Failed to connect to Supabase: ${error.message}`);
            this.logger.warn('Application starting without Supabase verification. Uploads may fail.');
        }
    }

    async getSignedUploadUrl(path: string): Promise<{ signedUrl: string; token: string; path: string; downloadUrl: string }> {
        // The backend ONLY generates a signed URL. The frontend uploads the file directly.
        // This bypasses Railway DNS issues completely.
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

    // DEPRECATED: Direct backend uploads are removed to stabilize Railway production
    async uploadPhoto(_file: Buffer, _filename: string): Promise<string> {
        throw new InternalServerErrorException('Backend uploads are disabled. Use signed-url flow.');
    }
}
