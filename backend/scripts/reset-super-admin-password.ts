import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import * as bcrypt from 'bcrypt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

async function main() {
    const app = await NestFactory.createApplicationContext(AppModule);

    const prisma = app.get(PrismaService);

    const email = 'rakshith@nexorair.com';
    const newPassword = 'Iwillwintheworld$23';

    const hash = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: { passwordHash: hash },
    });

    console.log('✅ Super Admin password reset successfully');

    await app.close();
}

main().catch((err) => {
    console.error('❌ Error resetting password:', err);
    process.exit(1);
});