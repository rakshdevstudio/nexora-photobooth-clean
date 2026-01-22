import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { LicenseService } from './license.service';
import { CreateLicenseDto, AssignLicenseDto, ValidateLicenseDto } from './dto/license.dto';

@Controller('licenses')
export class LicenseController {
    constructor(private readonly licenseService: LicenseService) { }

    @Post()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    create(@Body() createLicenseDto: CreateLicenseDto, @Request() req) {
        return this.licenseService.createLicense(createLicenseDto, req.user.userId, req.user.role);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    findAll(@Request() req) {
        return this.licenseService.findAll(req.user.userId, req.user.role);
    }

    @Post(':id/assign')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    assign(
        @Param('id') id: string,
        @Body() assignLicenseDto: AssignLicenseDto,
        @Request() req,
    ) {
        return this.licenseService.assignLicense(id, assignLicenseDto, req.user.userId, req.user.role);
    }

    @Patch(':id/revoke')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    revoke(@Param('id') id: string, @Request() req) {
        return this.licenseService.revokeLicense(id, req.user.userId, req.user.role);
    }

    @Post('validate')
    @UsePipes(new ValidationPipe({ whitelist: true }))
    validate(@Body() validateLicenseDto: ValidateLicenseDto) {
        return this.licenseService.validateLicense(validateLicenseDto);
    }
}
