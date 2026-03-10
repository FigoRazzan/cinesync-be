import {
  createParamDecorator,
  ExecutionContext,
  SetMetadata,
} from '@nestjs/common';
import { Role } from '@prisma/client';

// ============================================================
// KUNCI METADATA untuk Reflector
// ============================================================

/** Kunci metadata untuk menyimpan daftar role yang diizinkan */
export const ROLES_KEY = 'roles';

// ============================================================
// DECORATOR @Roles()
// ============================================================

/**
 * Decorator @Roles() - Menentukan role mana yang boleh mengakses endpoint
 *
 * Digunakan bersama RolesGuard untuk implementasi RBAC.
 *
 * Contoh penggunaan:
 * @Roles(Role.MANAGER)                      // Hanya Manajer
 * @Roles(Role.MANAGER, Role.CASHIER)        // Manajer atau Kasir
 * @Roles(Role.DISTRIBUTOR)                  // Hanya Distributor
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// ============================================================
// DECORATOR @Public()
// ============================================================

/**
 * Re-export @Public() dari public.decorator.ts agar bisa diimpor dari satu tempat
 */
export { Public } from './public.decorator';

// ============================================================
// DECORATOR @CurrentUser()
// ============================================================

/**
 * Decorator @CurrentUser() - Mengambil data user yang sedang login dari request
 *
 * Data user di-inject oleh JwtStrategy.validate() ke dalam request object
 * setelah token JWT berhasil divalidasi.
 *
 * Jika key opsional diberikan, hanya field tersebut yang dikembalikan.
 *
 * Contoh penggunaan:
 * @CurrentUser()            -> mengembalikan seluruh objek user
 * @CurrentUser('id')        -> mengembalikan hanya id user
 * @CurrentUser('role')      -> mengembalikan hanya role user
 *
 * async getProfile(@CurrentUser() user: UserFromJwt) { ... }
 * async getMyContracts(@CurrentUser('id') userId: string) { ... }
 */
export const CurrentUser = createParamDecorator(
  (key: string | undefined, ctx: ExecutionContext) => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: Record<string, unknown> }>();
    const user = request.user;

    // Jika key diberikan, kembalikan hanya field yang diminta
    // Contoh: @CurrentUser('id') -> user.id
    if (key && user) {
      return user[key];
    }

    // Jika tidak ada key, kembalikan seluruh objek user
    return user;
  },
);
