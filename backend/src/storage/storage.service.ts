import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class StorageService {
    private readonly logger = new Logger(StorageService.name);
    // private supabase: SupabaseClient; // Removed for network isolation
    private bucketName = process.env.SUPABASE_BUCKET || 'photos';

    constructor() {
        // STRICT ISOLATION: No Supabase Client on Backend
        // const supabaseUrl = process.env.SUPABASE_URL;
        // const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        this.logger.log('StorageService initialized (Frontend-only mode).');
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
