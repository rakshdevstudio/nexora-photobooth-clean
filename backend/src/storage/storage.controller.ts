import { Controller, Get, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { StorageService } from './storage.service';

@Controller('storage')
export class StorageController {
    constructor(private readonly storageService: StorageService) { }

    @Get('health')
    health() {
        return 'Storage Module Active';
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file'))
    async uploadFile(@UploadedFile() file: any) {
        console.log('Storage Upload Request Received');
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        const url = await this.storageService.uploadPhoto(file.buffer, file.originalname);
        console.log('Storage Generated URL:', url);
        return { downloadUrl: url };
    }
}
