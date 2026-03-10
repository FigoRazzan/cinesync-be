import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * PrismaService - Layanan untuk mengelola koneksi database PostgreSQL via Prisma ORM
 * Mengimplementasikan OnModuleInit dan OnModuleDestroy untuk lifecycle management
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      // Konfigurasi logging Prisma berdasarkan environment
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });
  }

  /**
   * Dipanggil saat modul NestJS diinisialisasi
   * Membuka koneksi ke database
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('✅ Berhasil terhubung ke database PostgreSQL');
    } catch (error) {
      this.logger.error('❌ Gagal terhubung ke database PostgreSQL', error);
      throw error;
    }
  }

  /**
   * Dipanggil saat modul NestJS dihancurkan (shutdown)
   * Menutup koneksi ke database dengan bersih
   */
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('🔌 Koneksi database ditutup');
  }
}
