import { Controller, Get, Post, Patch, Body, Param, UseGuards, Request, UsePipes, ValidationPipe } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AdminService } from './admin.service';
import { CreateAdminDto, UpdateAdminPermissionsDto, UpdateAdminStatusDto } from './dto/admin.dto';

@Controller('admins')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Post()
    @Roles(Role.SUPER_ADMIN)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    create(@Body() createAdminDto: CreateAdminDto, @Request() req) {
        return this.adminService.createAdmin(createAdminDto, req.user.userId);
    }

    @Get()
    @Roles(Role.SUPER_ADMIN, Role.ADMIN)
    findAll(@Request() req) {
        return this.adminService.findAll(req.user.role, req.user.userId);
    }

    @Patch(':id/permissions')
    @Roles(Role.SUPER_ADMIN)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    updatePermissions(
        @Param('id') id: string,
        @Body() updatePermissionsDto: UpdateAdminPermissionsDto,
        @Request() req,
    ) {
        return this.adminService.updatePermissions(id, updatePermissionsDto, req.user.userId);
    }

    @Patch(':id/status')
    @Roles(Role.SUPER_ADMIN)
    @UsePipes(new ValidationPipe({ whitelist: true }))
    updateStatus(
        @Param('id') id: string,
        @Body() updateStatusDto: UpdateAdminStatusDto,
        @Request() req,
    ) {
        return this.adminService.updateStatus(id, updateStatusDto, req.user.userId);
    }
}
