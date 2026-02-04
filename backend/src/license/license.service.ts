import { Injectable, ForbiddenException, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'crypto';
import { CreateLicenseDto, AssignLicenseDto, ValidateLicenseDto } from './dto/license.dto';
import { Role, LicenseStatus } from '@prisma/client';

@Injectable()
export class LicenseService {
    constructor(private prisma: PrismaService) { }

    private generateLicenseKey(): string {
        return randomBytes(16).toString('hex').toUpperCase();
    }

    async createLicense(dto: CreateLicenseDto, actorId: string, actorRole: Role) {
        if (actorRole !== Role.SUPER_ADMIN) {
            const permission = await this.prisma.adminPermission.findUnique({ where: { userId: actorId } });
            if (!permission?.canManageDevices) {
                throw new ForbiddenException('Insufficient permissions to create licenses');
            }
        }

        const key = this.generateLicenseKey();
        const license = await this.prisma.license.create({
            data: {
                key,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                issuerId: actorId,
            },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'LICENSE_CREATED',
                entity: 'License',
                entityId: license.id,
                actorId,
                details: { key: license.key, expiresAt: license.expiresAt },
            },
        });

        return license;
    }

    async findAll(actorId: string, actorRole: Role) {
        if (actorRole === Role.SUPER_ADMIN) {
            return this.prisma.license.findMany({
                include: { issuer: { select: { id: true, name: true, email: true } } },
            });
        } else {
            return this.prisma.license.findMany({
                where: { issuerId: actorId },
                include: { issuer: { select: { id: true, name: true, email: true } } },
            });
        }
    }

    async assignLicense(id: string, dto: AssignLicenseDto, actorId: string, actorRole: Role) {
        if (actorRole !== Role.SUPER_ADMIN) {
            const permission = await this.prisma.adminPermission.findUnique({ where: { userId: actorId } });
            if (!permission?.canManageDevices) {
                throw new ForbiddenException('Insufficient permissions to assign licenses');
            }
        }

        const license = await this.prisma.license.findUnique({ where: { id } });
        if (!license) throw new NotFoundException('License not found');
        if (license.status !== LicenseStatus.ACTIVE) throw new BadRequestException('License is not active');
        if (license.deviceId) throw new ConflictException('License already assigned');

        const updatedLicense = await this.prisma.license.update({
            where: { id },
            data: { deviceId: dto.deviceId },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'LICENSE_ASSIGNED',
                entity: 'License',
                entityId: license.id,
                actorId,
                details: { deviceId: dto.deviceId },
            },
        });

        return updatedLicense;
    }

    async revokeLicense(id: string, actorId: string, actorRole: Role) {
        if (actorRole !== Role.SUPER_ADMIN) {
            const permission = await this.prisma.adminPermission.findUnique({ where: { userId: actorId } });
            if (!permission?.canRevokeLicense) {
                throw new ForbiddenException('Insufficient permissions to revoke licenses');
            }
        }

        const license = await this.prisma.license.findUnique({ where: { id } });
        if (!license) throw new NotFoundException('License not found');

        const updatedLicense = await this.prisma.license.update({
            where: { id },
            data: { status: LicenseStatus.REVOKED },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'LICENSE_REVOKED',
                entity: 'License',
                entityId: license.id,
                actorId,
                details: { previousStatus: license.status },
            },
        });

        return updatedLicense;
    }


    async validateLicense(dto: ValidateLicenseDto) {
        const license = await this.prisma.license.findUnique({
            where: { key: dto.licenseKey },
        });

        if (!license) {
            throw new NotFoundException('License not found');
        }

        if (license.status !== LicenseStatus.ACTIVE) {
            throw new ForbiddenException('License is not active');
        }

        if (license.expiresAt && new Date() > license.expiresAt) {
            throw new ForbiddenException('License expired');
        }

        // Strict Device Binding Logic
        if (license.deviceId) {
            // License already bound to a device
            if (license.deviceId === dto.deviceId) {
                // Same device - allow
                return { valid: true, licenseId: license.id, expiresAt: license.expiresAt };
            } else {
                // Different device - reject immediately
                await this.prisma.auditLog.create({
                    data: {
                        action: 'LICENSE_DEVICE_MISMATCH',
                        entity: 'License',
                        entityId: license.id,
                        actorId: license.issuerId,
                        details: {
                            expectedDeviceId: license.deviceId,
                            receivedDeviceId: dto.deviceId,
                        },
                    },
                });
                throw new ForbiddenException('License already activated on another device');
            }
        } else {
            // First-time binding
            await this.prisma.license.update({
                where: { id: license.id },
                data: { deviceId: dto.deviceId },
            });

            await this.prisma.auditLog.create({
                data: {
                    action: 'LICENSE_DEVICE_BOUND',
                    entity: 'License',
                    entityId: license.id,
                    actorId: license.issuerId,
                    details: {
                        deviceId: dto.deviceId,
                    },
                },
            });

            return { valid: true, licenseId: license.id, expiresAt: license.expiresAt, bound: true };
        }
    }

    async rebindDevice(id: string, actorId: string, actorRole: Role) {
        if (actorRole !== Role.SUPER_ADMIN) {
            throw new ForbiddenException('Only Super Admin can rebind devices');
        }

        const license = await this.prisma.license.findUnique({ where: { id } });
        if (!license) throw new NotFoundException('License not found');

        const previousDeviceId = license.deviceId;

        await this.prisma.license.update({
            where: { id },
            data: { deviceId: null }
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'LICENSE_DEVICE_REBOUND',
                entity: 'License',
                entityId: license.id,
                actorId,
                details: {
                    previousDeviceId,
                    message: 'Device binding cleared by admin'
                },
            },
        });

        return { success: true };
    }
}
