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
                include: { device: true, issuer: { select: { id: true, name: true, email: true } } },
            });
        } else {
            return this.prisma.license.findMany({
                where: { issuerId: actorId },
                include: { device: true, issuer: { select: { id: true, name: true, email: true } } },
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

        const license = await this.prisma.license.findUnique({ where: { id }, include: { device: true } });
        if (!license) throw new NotFoundException('License not found');
        if (license.status !== LicenseStatus.ACTIVE) throw new BadRequestException('License is not active');
        if (license.deviceId) throw new ConflictException('License already assigned');

        let device = await this.prisma.device.findUnique({ where: { fingerprint: dto.fingerprint } });
        if (!device) {
            device = await this.prisma.device.create({
                data: {
                    fingerprint: dto.fingerprint,
                    name: dto.deviceName,
                },
            });
        }

        const updatedLicense = await this.prisma.license.update({
            where: { id },
            data: { deviceId: device.id },
            include: { device: true },
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'LICENSE_ASSIGNED',
                entity: 'License',
                entityId: license.id,
                actorId,
                details: { deviceId: device.id, fingerprint: device.fingerprint },
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
            include: { device: true },
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

        // Device Validation Logic
        if (license.device) {
            // 1. Check strict match
            if (license.device.fingerprint === dto.deviceFingerprint) {
                // If we recovered from a mismatch (switched back to valid device), clear the warning?
                if (license.mismatchDetectedAt) {
                    await this.prisma.license.update({
                        where: { id: license.id },
                        data: { mismatchDetectedAt: null }
                    });
                }
                return { valid: true, licenseId: license.id, expiresAt: license.expiresAt };
            }

            // 2. Mismatch Case - GRACE PERIOD LOGIC
            const now = new Date();
            let mismatchStart = license.mismatchDetectedAt;

            if (!mismatchStart) {
                // Start Grace Period
                mismatchStart = now;
                await this.prisma.license.update({
                    where: { id: license.id },
                    data: { mismatchDetectedAt: mismatchStart }
                });
            }

            const diffTime = Math.abs(now.getTime() - mismatchStart.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const GRACE_DAYS = 7;
            const isGrace = diffDays <= GRACE_DAYS;

            // Log Mismatch in Audit Log
            await this.prisma.auditLog.create({
                data: {
                    action: isGrace ? 'LICENSE_MISMATCH_GRACE' : 'LICENSE_MISMATCH_BLOCKED',
                    entity: 'License',
                    entityId: license.id,
                    actorId: license.issuerId,
                    details: {
                        expected: license.device.fingerprint,
                        received: dto.deviceFingerprint,
                        graceDay: diffDays,
                        allowed: isGrace
                    },
                },
            });

            if (isGrace) {
                // Soft Fail / Warn
                // We return valid but maybe we should flag it? 
                // The frontend expects { valid: boolean }.
                console.warn(`License mismatch allowed (Day ${diffDays}/${GRACE_DAYS})`);
                return { valid: true, licenseId: license.id, expiresAt: license.expiresAt, warning: 'Device Mismatch - Grace Period' };
            } else {
                // Hard Lock
                throw new ForbiddenException('DEVICE_MISMATCH');
            }
        } else {
            // 3. First time Bind
            let device = await this.prisma.device.findUnique({ where: { fingerprint: dto.deviceFingerprint } });

            if (!device) {
                device = await this.prisma.device.create({
                    data: {
                        fingerprint: dto.deviceFingerprint,
                        name: `Device-${dto.deviceFingerprint.substring(0, 6)}`
                    }
                });
            }

            await this.prisma.license.update({
                where: { id: license.id },
                data: { deviceId: device.id }
            });

            await this.prisma.auditLog.create({
                data: {
                    action: 'LICENSE_BOUND',
                    entity: 'License',
                    entityId: license.id,
                    actorId: license.issuerId,
                    details: {
                        deviceId: device.id,
                        fingerprint: device.fingerprint
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

        await this.prisma.license.update({
            where: { id },
            data: {
                deviceId: null,
                mismatchDetectedAt: null
            }
        });

        await this.prisma.auditLog.create({
            data: {
                action: 'LICENSE_REBOUND',
                entity: 'License',
                entityId: license.id,
                actorId,
                details: {
                    message: 'Device binding cleared by admin'
                },
            },
        });

        return { success: true };
    }
}
