import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class BootstrapService implements OnApplicationBootstrap {
    private readonly logger = new Logger(BootstrapService.name);

    constructor(private readonly prisma: PrismaService) { }

    async onApplicationBootstrap() {
        await this.createSuperAdmin();
    }

    private async createSuperAdmin() {
        const email = process.env.SUPER_ADMIN_EMAIL;
        const password = process.env.SUPER_ADMIN_PASSWORD;

        if (!email || !password) {
            this.logger.warn(
                'SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not defined. Skipping Super Admin creation.',
            );
            return;
        }

        try {
            // Check if any Super Admin exists
            const existingSuperAdmin = await this.prisma.user.findFirst({
                where: { role: Role.SUPER_ADMIN },
            });

            if (existingSuperAdmin) {
                this.logger.log('Super Admin already exists. Skipping creation.');
                return;
            }

            this.logger.log('No Super Admin found. Creating one...');

            const passwordHash = await bcrypt.hash(password, 10);

            const superAdmin = await this.prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    name: 'Super Admin',
                    role: Role.SUPER_ADMIN,
                    isActive: true,
                },
            });

            await this.prisma.auditLog.create({
                data: {
                    action: 'BOOTSTRAP_SUPER_ADMIN',
                    entity: 'User',
                    entityId: superAdmin.id,
                    actorId: superAdmin.id, // Self-attributed creation since it's a bootstrap event
                    details: { message: 'Initial Super Admin created via bootstrap' },
                },
            });

            this.logger.log(`Super Admin created successfully with ID: ${superAdmin.id}`);
        } catch (error) {
            this.logger.error('Failed to create Super Admin', error);
        }
    }
}
