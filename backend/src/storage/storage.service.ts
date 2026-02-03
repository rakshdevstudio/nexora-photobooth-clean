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

    // This service is now Deprecated/Empty as uploads are handled entirely by the frontend.
    // We keep the class to avoid breaking dependency injection in the module until full cleanup.

    // DEPRECATED: Direct backend uploads are disabled
    async uploadPhoto(_file: Buffer, _filename: string): Promise<string> {
        throw new InternalServerErrorException('Backend uploads are disabled. Use signed-url flow.');
    }
}
