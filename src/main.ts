import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Aktifkan CORS agar Frontend (port 3000) bisa mengakses Backend (port 3001)
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Global prefix untuk semua endpoint API (contoh: /api/auth, /api/contracts)
  app.setGlobalPrefix('api');

  // Global ValidationPipe untuk validasi DTO secara otomatis
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Buang field yang tidak ada di DTO
      forbidNonWhitelisted: true, // Tolak request jika ada field asing
      transform: true, // Otomatis transform tipe data sesuai DTO
    }),
  );

  const port = process.env.PORT ?? 3001;
  await app.listen(port);

  console.log(`🚀 Cine-Sync Backend berjalan di: http://localhost:${port}/api`);
}
void bootstrap();
