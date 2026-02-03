import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8080',
      'https://nexora-photobooth-clean.vercel.app',
      'https://nexora-photobooth-clean-production.up.railway.app'
    ],
    methods: 'GET,POST,PUT,DELETE,OPTIONS',
    credentials: true,
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
// Force restart to load env vars
