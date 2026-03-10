import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Tipe data user yang dikembalikan setelah autentikasi
 * Password tidak ikut dikembalikan demi keamanan
 */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

/**
 * AuthService - Layanan untuk menangani autentikasi pengguna
 *
 * Fitur:
 * - Login dengan email & password -> menghasilkan JWT token
 * - Register user baru (hanya bisa dilakukan oleh MANAGER)
 * - Hash password menggunakan bcrypt sebelum disimpan ke database
 * - Generate JWT token dengan payload yang aman
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  // Jumlah salt rounds untuk bcrypt (semakin tinggi = semakin aman tapi lebih lambat)
  private readonly BCRYPT_SALT_ROUNDS = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // ============================================================
  // LOGIN
  // ============================================================

  /**
   * Proses login pengguna
   *
   * Alur:
   * 1. Cari user berdasarkan email di database
   * 2. Bandingkan password yang dikirim dengan hash di database (bcrypt.compare)
   * 3. Jika valid, generate JWT token dan kembalikan ke client
   *
   * @param dto - Data login (email & password)
   * @returns JWT access token dan data user
   * @throws UnauthorizedException jika email/password salah
   */
  async login(dto: LoginDto) {
    const { email, password } = dto;

    // Cari user berdasarkan email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Jika user tidak ditemukan, jangan berikan info spesifik
    // (hindari user enumeration attack)
    if (!user) {
      throw new UnauthorizedException('Email atau password salah');
    }

    // Bandingkan password dengan hash yang tersimpan di database
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      this.logger.warn(`❌ Percobaan login gagal untuk email: ${email}`);
      throw new UnauthorizedException('Email atau password salah');
    }

    this.logger.log(`✅ Login berhasil: ${user.email} (${user.role})`);

    // Generate JWT token
    const token = this.generateToken(user);

    return {
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }

  // ============================================================
  // REGISTER
  // ============================================================

  /**
   * Proses registrasi user baru
   *
   * Keamanan:
   * - Hanya MANAGER yang bisa membuat user baru (validasi di controller via @Roles)
   * - MANAGER tidak bisa membuat user dengan role MANAGER lain
   *   (hanya bisa membuat CASHIER dan DISTRIBUTOR)
   * - Password di-hash menggunakan bcrypt sebelum disimpan
   * - Email harus unik di seluruh sistem
   *
   * @param dto - Data registrasi user baru
   * @param creatorRole - Role dari user yang membuat akun baru (untuk validasi)
   * @returns Data user yang baru dibuat (tanpa password)
   * @throws ConflictException jika email sudah terdaftar
   * @throws ForbiddenException jika mencoba membuat akun MANAGER baru
   */
  async register(dto: RegisterDto, creatorRole: Role) {
    const { name, email, password, role } = dto;

    // Keamanan: MANAGER tidak boleh membuat akun MANAGER lain
    // Mencegah eskalasi privilege
    if (role === Role.MANAGER) {
      throw new ForbiddenException(
        'Tidak diizinkan membuat akun dengan role MANAGER',
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException(`Email '${email}' sudah terdaftar di sistem`);
    }

    // Hash password sebelum disimpan ke database
    const hashedPassword = await bcrypt.hash(password, this.BCRYPT_SALT_ROUNDS);

    // Simpan user baru ke database
    const newUser = await this.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        // Password TIDAK ikut dikembalikan
      },
    });

    this.logger.log(
      `✅ User baru berhasil dibuat: ${newUser.email} (${newUser.role}) oleh ${creatorRole}`,
    );

    return {
      message: 'Akun berhasil dibuat',
      user: newUser,
    };
  }

  // ============================================================
  // GET PROFILE
  // ============================================================

  /**
   * Mengambil profil user yang sedang login
   *
   * @param userId - ID user dari JWT token
   * @returns Data profil user (tanpa password)
   * @throws UnauthorizedException jika user tidak ditemukan
   */
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Pengguna tidak ditemukan');
    }

    return user;
  }

  // ============================================================
  // HELPER: GENERATE JWT TOKEN
  // ============================================================

  /**
   * Generate JWT access token untuk user
   *
   * Payload token berisi informasi minimal yang diperlukan:
   * - sub: ID user (standar JWT)
   * - email: Email user
   * - role: Role user (untuk RBAC di frontend)
   *
   * KEAMANAN: Jangan simpan data sensitif (password, dll) di dalam token
   *
   * @param user - Data user yang sudah terautentikasi
   * @returns JWT token string
   */
  private generateToken(user: AuthenticatedUser): string {
    const payload = {
      sub: user.id, // Subject: ID user
      email: user.email,
      role: user.role,
    };

    return this.jwtService.sign(payload);
  }

  // ============================================================
  // SEED ADMIN (Untuk inisialisasi pertama kali)
  // ============================================================

  /**
   * Membuat akun MANAGER pertama jika belum ada sama sekali di database
   * Digunakan untuk inisialisasi sistem pertama kali
   *
   * PERINGATAN: Nonaktifkan endpoint ini setelah setup awal selesai!
   *
   * @returns Data manager yang baru dibuat atau pesan bahwa sudah ada
   */
  async seedManager() {
    // Cek apakah sudah ada MANAGER di database
    const existingManager = await this.prisma.user.findFirst({
      where: { role: Role.MANAGER },
    });

    if (existingManager) {
      return {
        message: 'Akun Manager sudah ada di sistem',
        email: existingManager.email,
      };
    }

    // Buat akun manager default
    // GANTI PASSWORD INI SEGERA SETELAH LOGIN PERTAMA!
    const defaultPassword = 'Manager@123';
    const hashedPassword = await bcrypt.hash(
      defaultPassword,
      this.BCRYPT_SALT_ROUNDS,
    );

    const manager = await this.prisma.user.create({
      data: {
        name: 'Admin Manager',
        email: 'manager@cinesync.com',
        password: hashedPassword,
        role: Role.MANAGER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    this.logger.warn(
      `⚠️  Akun Manager default dibuat! Email: ${manager.email} | Password: ${defaultPassword}`,
    );
    this.logger.warn('⚠️  SEGERA GANTI PASSWORD SETELAH LOGIN PERTAMA!');

    return {
      message: 'Akun Manager default berhasil dibuat. SEGERA GANTI PASSWORD!',
      user: manager,
      defaultPassword,
    };
  }
}
