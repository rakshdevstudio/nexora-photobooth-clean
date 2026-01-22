import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MaintenanceService {
    constructor(private prisma: PrismaService) { }

    async cleanupLicenses(days: number, adminId: string) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        // Using transaction to ensure audit log and update happen together
        return this.prisma.$transaction(async (tx) => {
            const result = await tx.license.updateMany({
                where: {
                    status: 'EXPIRED',
                    expiresAt: { lt: cutoff },
                    isArchived: false
                },
                data: { isArchived: true }
            });

            await tx.auditLog.create({
                data: {
                    action: 'MAINTENANCE_CLEANUP_LICENSES',
                    entity: 'LICENSE',
                    actorId: adminId,
                    details: { days, affectedCount: result.count }
                }
            });

            return { success: true, affectedCount: result.count };
        });
    }

    async archiveAuditLogs(days: number, adminId: string) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return this.prisma.$transaction(async (tx) => {
            const result = await tx.auditLog.updateMany({
                where: {
                    createdAt: { lt: cutoff },
                    isArchived: false,
                    action: { not: 'MAINTENANCE_ARCHIVE_AUDIT_LOGS' } // Prevent self-archive of the record? No, action happens after.
                    // Actually we should just archive everything old.
                },
                data: { isArchived: true }
            });

            await tx.auditLog.create({
                data: {
                    action: 'MAINTENANCE_ARCHIVE_AUDIT_LOGS',
                    entity: 'AUDIT_LOG',
                    actorId: adminId,
                    details: { days, affectedCount: result.count }
                }
            });

            return { success: true, affectedCount: result.count };
        });
    }

    async cleanupDevices(days: number, adminId: string) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);

        return this.prisma.$transaction(async (tx) => {
            // Find devices with no license or expired/revoked license and no updates recently
            // For simplicity based on requirements: "inactive for more than X days" -> updatedAt < cutoff
            const result = await tx.device.updateMany({
                where: {
                    updatedAt: { lt: cutoff },
                    isArchived: false
                },
                data: { isArchived: true }
            });

            await tx.auditLog.create({
                data: {
                    action: 'MAINTENANCE_CLEANUP_DEVICES',
                    entity: 'DEVICE',
                    actorId: adminId,
                    details: { days, affectedCount: result.count }
                }
            });

            return { success: true, affectedCount: result.count };
        });
    }
}
