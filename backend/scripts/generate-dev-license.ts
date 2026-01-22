import { PrismaClient, LicenseStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Hardcoded for script simplicity or read from env if needed
// But better to try to read the config if possible, or just use the standard DATABASE_URL env var if the config uses it.
// The service used `prismaConfig.datasource!.url`. 
// Let's assume standard DATABASE_URL works for now, or fallback to the config if I can import it.
// To avoid import issues with ts-node and relative paths outside src, let's look at prisma.config.ts first.

// Hardcoded for script simplicity 
const connectionString = "postgresql://5df15c08fc62b281eb271f88cf559144f42069463b0edb15a341e1b8fc8d7ce2:sk_6iejtKDHKop39k-kWxvIT@db.prisma.io:5432/postgres?sslmode=require";
const pool = new Pool({ connectionString }); // pg detects sslmode from URL usually, but explicit might be safer if it fails
// const pool = new Pool({ connectionString, ssl: { rejectUnauthorized: false } });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
    try {
        // 1. Find a SUPER_ADMIN to be the issuer
        const admin = await prisma.user.findFirst({
            where: { role: 'SUPER_ADMIN' }
        });

        if (!admin) {
            console.error('Error: No SUPER_ADMIN found in database. Cannot create license.');
            process.exit(1);
        }

        // 2. Generate Key
        const key = randomBytes(16).toString('hex').toUpperCase();

        // 3. Create License
        const license = await prisma.license.create({
            data: {
                key,
                status: LicenseStatus.ACTIVE,
                issuerId: admin.id,
                expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
            }
        });

        console.log('\n=============================================');
        console.log('✅ NEW LICENSE GENERATED SUCCESSFULY');
        console.log('=============================================');
        console.log(`Key: ${license.key}`);
        console.log(`Status: ${license.status}`);
        console.log(`Expires: ${license.expiresAt}`);
        console.log('=============================================\n');

    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
