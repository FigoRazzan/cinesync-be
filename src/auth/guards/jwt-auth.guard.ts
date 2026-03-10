import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * JwtAuthGuard - Guard untuk memproteksi endpoint yang memerlukan autentikasi
 *
 * Cara kerja:
 * 1. Cek apakah endpoint ditandai sebagai @Public() - jika iya, lewati autentikasi
 * 2. Jika tidak, validasi JWT token dari header Authorization
 * 3. Jika token valid, attach data user ke request object
 * 4. Jika token tidak valid atau tidak ada, kembalikan error 401 Unauthorized
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  /**
   * Menentukan apakah request boleh dilanjutkan atau tidak
   *
   * @param context - ExecutionContext dari NestJS
   * @returns true jika request diizinkan, false/throw jika ditolak
   */
  canActivate(context: ExecutionContext) {
    // Cek apakah endpoint memiliki decorator @Public()
    // Jika iya, lewati proses autentikasi JWT
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Lanjutkan dengan validasi JWT standar dari Passport
    return super.canActivate(context);
  }

  /**
   * Dipanggil setelah proses autentikasi selesai
   * Override untuk memberikan pesan error yang lebih informatif
   *
   * @param err - Error yang terjadi (jika ada)
   * @param user - Data user hasil validasi token
   * @param info - Informasi tambahan dari Passport (misal: alasan token ditolak)
   */
  handleRequest(err: any, user: any, info: any) {
    // Jika ada error atau user tidak ditemukan, lempar UnauthorizedException
    if (err || !user) {
      // Memberikan pesan error yang spesifik berdasarkan info dari Passport
      let message = 'Akses ditolak: token tidak valid atau tidak ditemukan';

      if (info?.name === 'TokenExpiredError') {
        message = 'Akses ditolak: token sudah kadaluarsa, silakan login ulang';
      } else if (info?.name === 'JsonWebTokenError') {
        message = 'Akses ditolak: format token tidak valid';
      } else if (info?.name === 'NotBeforeError') {
        message = 'Akses ditolak: token belum aktif';
      }

      throw err || new UnauthorizedException(message);
    }

    return user;
  }
}
