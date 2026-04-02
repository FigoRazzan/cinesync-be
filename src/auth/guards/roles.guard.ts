import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AppRole, ROLES_KEY } from '../decorators/roles.decorator';

/**
 * RolesGuard - Guard untuk memvalidasi Role pengguna (RBAC)
 *
 * Cara kerja:
 * 1. Ambil daftar role yang diizinkan dari decorator @Roles() di endpoint
 * 2. Ambil data user yang sudah di-attach oleh JwtAuthGuard (request.user)
 * 3. Cek apakah role user termasuk dalam daftar role yang diizinkan
 * 4. Jika tidak, kembalikan error 403 Forbidden
 *
 * Penggunaan:
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Roles(Role.MANAGER)
 * @Get('contracts')
 * getContracts() { ... }
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  /**
   * Menentukan apakah user dengan role tertentu boleh mengakses endpoint
   *
   * @param context - ExecutionContext dari NestJS
   * @returns true jika role user diizinkan, throw ForbiddenException jika tidak
   */
  canActivate(context: ExecutionContext): boolean {
    // Ambil daftar role yang diizinkan dari metadata decorator @Roles()
    // Cek di level handler (method) dulu, lalu di level class (controller)
    const requiredRoles = this.reflector.getAllAndOverride<AppRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Jika endpoint tidak memiliki decorator @Roles(), izinkan semua user yang sudah login
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Ambil data user dari request object (sudah di-inject oleh JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Jika user tidak ada di request (seharusnya tidak terjadi jika JwtAuthGuard berjalan duluan)
    if (!user) {
      throw new ForbiddenException(
        'Akses ditolak: data pengguna tidak ditemukan',
      );
    }

    // Cek apakah role user ada di dalam daftar role yang diizinkan
    const hasRequiredRole = requiredRoles.some(
      (requiredRole) => user.role === requiredRole,
    );

    // Jika role tidak sesuai, lempar ForbiddenException dengan pesan yang informatif
    if (!hasRequiredRole) {
      throw new ForbiddenException(
        `Akses ditolak: fitur ini hanya untuk ${requiredRoles.join(' atau ')}. ` +
          `Role Anda saat ini: ${user.role}`,
      );
    }

    return true;
  }
}
