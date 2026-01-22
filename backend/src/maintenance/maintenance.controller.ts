import { Controller, Post, Body, UseGuards, Request, ForbiddenException, BadRequestException } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('maintenance')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.SUPER_ADMIN)
export class MaintenanceController {
    constructor(private maintenanceService: MaintenanceService) { }

    private validateDays(days: number) {
        if (!days || days < 1 || days > 365) {
            throw new BadRequestException('Days must be between 1 and 365');
        }
    }

    @Post('licenses/cleanup')
    async cleanupLicenses(@Body('days') days: number, @Request() req) {
        this.validateDays(days);
        return this.maintenanceService.cleanupLicenses(days, req.user.userId);
    }

    @Post('audit-logs/archive')
    async archiveAuditLogs(@Body('days') days: number, @Request() req) {
        this.validateDays(days);
        return this.maintenanceService.archiveAuditLogs(days, req.user.userId);
    }

    @Post('devices/cleanup')
    async cleanupDevices(@Body('days') days: number, @Request() req) {
        this.validateDays(days);
        return this.maintenanceService.cleanupDevices(days, req.user.userId);
    }
}
