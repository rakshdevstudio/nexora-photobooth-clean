import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { LicenseModule } from './license/license.module';
import { StorageModule } from './storage/storage.module';

@Module({
  imports: [PrismaModule, BootstrapModule, AuthModule, AdminModule, LicenseModule, StorageModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }