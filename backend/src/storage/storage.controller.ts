import { Controller, Get, Post, UseInterceptors, UploadedFile, BadRequestException, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Get('health')
    health() {
        return 'Storage Module Active';
    }

    @Post('signed-url')
    async getSignedUrl(@Body() body: { path: string }) {
        if (!body.path) {
            throw new BadRequestException('Path is required');
        }
        return this.storageService.getSignedUploadUrl(body.path);
    }

    // DEPRECATED: Do not use. Frontend should use signed-url flow.
    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any) {
        console.warn('Deprecated /storage/upload called. This endpoint is disabled.');
        throw new BadRequestException('Backend uploads are disabled. Use /storage/signed-url and direct upload.');
    }
}
