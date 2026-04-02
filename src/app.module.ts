import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ContractsModule } from './contracts/contracts.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';
import { MoviesModule } from './movies/movies.module';

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
    // Modul database (Global - tidak perlu import ulang di modul lain)
    PrismaModule,

    // Modul autentikasi (JWT + RBAC)
    AuthModule,

    // Modul pengajuan dan persetujuan kontrak producer
    ContractsModule,

    // Modul paket langganan user
    SubscriptionsModule,

    // Modul integrasi film eksternal (TMDB)
    MoviesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
