"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const crypto_1 = require("crypto");
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
require("dotenv/config");
const connectionString = process.env.DATABASE_URL;
const pool = new pg_1.Pool({ connectionString });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
async function main() {
    // 1. Ensure a Super Admin exists (used as issuer)
    let admin = await prisma.user.findFirst({
        where: { role: client_1.Role.SUPER_ADMIN },
    });
    if (!admin) {
        console.log('No Super Admin found. Creating a temporary one...');
        // Only creating if absent, referencing env vars if possible or defaults
        const email = process.env.SUPER_ADMIN_EMAIL || 'admin@example.com';
        // Password hash omitted for brevity as we just need the ID for the relation
        // In a real scenario, use correct hash. Here assuming admin exists or creating placeholder.
        // If strict FK, we need a valid user. 
        // Let's assume one exists or we create a dummy one.
        // Actually, looking at .env, SUPER_ADMIN_EMAIL is set.
        // Check if any user exists
        const anyUser = await prisma.user.findFirst();
        if (anyUser) {
            admin = anyUser;
        }
        else {
            console.error("No users found to set as issuer. Please ensure database is seeded.");
            process.exit(1);
        }
    }
    // 2. Generate Key
    const key = (0, crypto_1.randomBytes)(16).toString('hex').toUpperCase();
    // 3. Create License
    const license = await prisma.license.create({
        data: {
            key,
            // Expires in 30 days
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            issuerId: admin.id,
            status: 'ACTIVE',
        },
    });
    console.log('\n=============================================');
    console.log('LICENSE KEY GENERATED SUCCESSFULLY');
    console.log('=============================================');
    console.log(`Key: ${license.key}`);
    console.log(`Expires: ${license.expiresAt}`);
    console.log('=============================================\n');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
