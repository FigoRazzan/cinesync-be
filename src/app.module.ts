import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

/**
 * AppModule - Modul utama aplikasi Cine-Sync Backend
 *
 * Mendaftarkan semua modul yang digunakan di seluruh aplikasi:
 * - ConfigModule: Untuk membaca variabel environment (.env)
 * - PrismaModule: Koneksi database PostgreSQL (Global)
 * - AuthModule: Autentikasi JWT dan RBAC
 */
@Module({
  imports: [
    // Konfigurasi environment variables secara global
    // Sehingga process.env.*** bisa diakses di mana saja
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Modul database (Global - tidak perlu import ulang di modul lain)
    PrismaModule,

    // Modul autentikasi (JWT + RBAC)
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
