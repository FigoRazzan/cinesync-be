import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Payload yang tersimpan di dalam JWT token
 */
export interface JwtPayload {
  sub: string; // ID user (subject)
  email: string;
  role: string;
  iat?: number; // Issued at (otomatis dari JWT)
  exp?: number; // Expiration (otomatis dari JWT)
}

/**
 * JwtStrategy - Strategi Passport untuk memvalidasi JWT Token
 *
 * Cara kerja:
 * 1. Setiap request yang masuk, guard akan mengambil token dari header Authorization
 * 2. Token di-decode dan diverifikasi menggunakan JWT_SECRET
 * 3. Payload token digunakan untuk mengambil data user dari database
 * 4. Jika user tidak ditemukan atau token invalid, request ditolak (401)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly prisma: PrismaService) {
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error('JWT_SECRET belum dikonfigurasi di environment');
    }

    super({
      // Ambil token dari header: "Authorization: Bearer <token>"
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // Tolak token yang sudah expired
      ignoreExpiration: false,

      // Secret key untuk verifikasi token - WAJIB ada di .env
      secretOrKey: jwtSecret,
    });
  }

  /**
   * Dipanggil setelah JWT berhasil diverifikasi
   * Return value akan tersimpan di request.user
   *
   * @param payload - Data yang tersimpan di dalam JWT token
   * @returns Data user yang akan di-attach ke request object
   */
  async validate(payload: JwtPayload) {
    // Cari user di database berdasarkan ID dari payload token
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        // Password TIDAK ikut diambil demi keamanan
      },
    });

    // Jika user tidak ditemukan (misal sudah dihapus), tolak akses
    if (!user) {
      throw new UnauthorizedException(
        'Token tidak valid: pengguna tidak ditemukan',
      );
    }

    // Data ini akan tersedia di setiap handler via @Req() atau decorator @CurrentUser()
    return user;
  }
}
