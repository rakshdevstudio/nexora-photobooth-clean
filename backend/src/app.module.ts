import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { BootstrapModule } from './bootstrap/bootstrap.module';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './admin/admin.module';
import { LicenseModule } from './license/license.module';
import { MaintenanceModule } from './maintenance/maintenance.module';


@Module({
  imports: [PrismaModule, BootstrapModule, AuthModule, AdminModule, LicenseModule, MaintenanceModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }