import { Injectable, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { CreateAdminDto, UpdateAdminPermissionsDto, UpdateAdminStatusDto } from './dto/admin.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
    constructor(private prisma: PrismaService) { }

    async createAdmin(dto: CreateAdminDto, actorId: string) {
        const existingUser = await this.prisma.user.findUnique({ where: { email: dto.email } });
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        const passwordHash = await bcrypt.hash(dto.password, 10);

        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                passwordHash,
                name: dto.name,
                role: Role.ADMIN,
                isActive: true,
                permissions: {
                    create: {},
                },
            },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'ADMIN_CREATED',
                entity: 'User',
                entityId: user.id,
                actorId,
                details: { email: user.email, name: user.name },
            },
        });

        const { passwordHash: _, ...result } = user;
        return result;
    }

    async updatePermissions(id: string, dto: UpdateAdminPermissionsDto, actorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot modify SUPER_ADMIN permissions');
        }

        const permissions = await this.prisma.adminPermission.update({
            where: { userId: id },
            data: dto,
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'ADMIN_PERMISSIONS_UPDATED',
                entity: 'AdminPermission',
                entityId: permissions.id,
                actorId,
                details: dto as any,
            },
        });

        return permissions;
    }

    async updateStatus(id: string, dto: UpdateAdminStatusDto, actorId: string) {
        const user = await this.prisma.user.findUnique({ where: { id } });
        if (!user) {
            throw new NotFoundException('User not found');
        }
        if (user.role === Role.SUPER_ADMIN) {
            throw new ForbiddenException('Cannot modify SUPER_ADMIN status');
        }

        const updatedUser = await this.prisma.user.update({
            where: { id },
            data: { isActive: dto.isActive },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'ADMIN_STATUS_CHANGED',
                entity: 'User',
                entityId: user.id,
                actorId,
                details: { isActive: dto.isActive },
            },
        });

        const { passwordHash: _, ...result } = updatedUser;
        return result;
    }

    async findAll(currentUserRole: Role, currentUserId: string) {
        if (currentUserRole === Role.SUPER_ADMIN) {
            const users = await this.prisma.user.findMany({
                where: { role: Role.ADMIN },
                include: { permissions: true },
            });
            return users.map(user => {
                const { passwordHash, ...result } = user;
                return result;
            });
        } else {
            // Regular ADMIN only sees themselves
            const user = await this.prisma.user.findUnique({
                where: { id: currentUserId },
                include: { permissions: true },
            });
            if (!user) return [];
            const { passwordHash, ...result } = user;
            return [result];
        }
    }
}
