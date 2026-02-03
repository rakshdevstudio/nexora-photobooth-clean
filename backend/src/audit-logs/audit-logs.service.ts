import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditLogsService {
    constructor(private prisma: PrismaService) { }

    async findAll(userId: string, role: string) {
        // Only SUPER_ADMIN or user with permission can view logs
        // Assuming RolesGuard handles the role check, or we check permissions here

        const logs = await this.prisma.auditLog.findMany({
            where: { isArchived: false },
            include: {
                actor: {
                    select: { email: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return logs.map(log => ({
            id: log.id,
            action: log.action,
            actorEmail: log.actor.email,
            metadata: log.details,
            createdAt: log.createdAt
        }));
    }
}
