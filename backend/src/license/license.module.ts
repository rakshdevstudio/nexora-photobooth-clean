import { Module } from '@nestjs/common';
import { LicenseController } from './license.controller';
import { LicenseService } from './license.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    controllers: [LicenseController],
    providers: [LicenseService],
    imports: [PrismaModule],
})
export class LicenseModule { }
