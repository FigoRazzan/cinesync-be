import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * AuthModule - Modul autentikasi utama Cine-Sync
 *
 * Mengintegrasikan:
 * - PassportModule: Framework autentikasi untuk NestJS
 * - JwtModule: Untuk generate dan verifikasi JWT token
 * - JwtStrategy: Strategi validasi token di setiap request
 * - AuthService: Business logic autentikasi
 * - AuthController: Endpoint-endpoint autentikasi
 *
 * Catatan:
 * PrismaModule tidak perlu di-import karena sudah @Global()
 */
@Module({
  imports: [
    // Konfigurasi Passport dengan strategi default JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Konfigurasi JWT Module
    JwtModule.register({
      // Secret key untuk signing token - WAJIB ganti di production via .env
      secret:
        process.env.JWT_SECRET ?? 'cine-sync-secret-key-ganti-di-production',

      signOptions: {
        // Token berlaku selama 7 hari (bisa disesuaikan)
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '7d') as any,

        // Algoritma signing (default HS256 sudah cukup aman)
        algorithm: 'HS256',
      },
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,

    // Strategi JWT untuk validasi token di setiap request yang diproteksi
    JwtStrategy,
  ],

  // Export agar modul lain bisa menggunakan JwtAuthGuard dan PassportModule
  exports: [AuthService, JwtModule, PassportModule],
})
export class AuthModule {}
