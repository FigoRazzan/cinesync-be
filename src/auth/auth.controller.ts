import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { CurrentUser, Public, Roles } from './decorators/roles.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';

/**
 * AuthController - Controller untuk menangani semua endpoint autentikasi
 *
 * Base route: /api/auth
 *
 * Endpoint:
 * - POST /api/auth/login          -> Login (publik)
 * - POST /api/auth/register       -> Registrasi user baru (hanya MANAGER)
 * - GET  /api/auth/profile        -> Ambil profil user yang sedang login
 * - POST /api/auth/seed-manager   -> Buat akun manager pertama (publik, satu kali pakai)
 */
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ============================================================
  // POST /api/auth/login
  // ============================================================

  /**
   * Endpoint Login
   *
   * Publik - tidak memerlukan token JWT.
   * Menerima email & password, mengembalikan JWT access token
   * beserta data user (tanpa password).
   *
   * @param dto - LoginDto { email, password }
   * @returns { accessToken: string, user: { id, name, email, role } }
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK) // Override default 201 -> 200 untuk login
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // ============================================================
  // POST /api/auth/register
  // ============================================================

  /**
   * Endpoint Registrasi User Baru
   *
   * Diproteksi - hanya bisa diakses oleh MANAGER.
   * MANAGER bisa membuat akun CASHIER dan DISTRIBUTOR baru.
   * MANAGER tidak bisa membuat akun MANAGER lain (dicegah di service).
   *
   * @param dto     - RegisterDto { name, email, password, role }
   * @param creator - Data user MANAGER yang sedang login (dari JWT)
   * @returns { message: string, user: { id, name, email, role } }
   */
  @Roles(Role.MANAGER)
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body() dto: RegisterDto,
    @CurrentUser('role') creatorRole: Role,
  ) {
    return this.authService.register(dto, creatorRole);
  }

  // ============================================================
  // GET /api/auth/profile
  // ============================================================

  /**
   * Endpoint Profil User
   *
   * Diproteksi - memerlukan token JWT yang valid.
   * Semua role (MANAGER, CASHIER, DISTRIBUTOR) bisa mengakses endpoint ini.
   * Mengembalikan data profil user yang sedang login berdasarkan token JWT-nya.
   *
   * @param userId - ID user yang diambil dari payload JWT token
   * @returns Data profil user { id, name, email, role, createdAt, updatedAt }
   */
  @Get('profile')
  async getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  // ============================================================
  // POST /api/auth/seed-manager
  // ============================================================

  /**
   * Endpoint Seed Manager
   *
   * Publik - tidak memerlukan token JWT.
   * Digunakan HANYA SEKALI untuk inisialisasi akun Manager pertama di sistem.
   * Jika sudah ada Manager, endpoint ini akan mengembalikan pesan bahwa sudah ada.
   *
   * ⚠️  PERINGATAN KEAMANAN:
   * Nonaktifkan atau hapus endpoint ini setelah setup awal selesai!
   * Atau tambahkan proteksi tambahan seperti secret key di production.
   *
   * @returns Informasi akun manager yang dibuat (termasuk default password)
   */
  @Public()
  @Post('seed-manager')
  @HttpCode(HttpStatus.OK)
  async seedManager() {
    return this.authService.seedManager();
  }
}
