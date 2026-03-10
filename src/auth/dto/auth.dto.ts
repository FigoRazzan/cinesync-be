import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  MinLength,
  MaxLength,
  IsOptional,
} from 'class-validator';
import { Role } from '@prisma/client';

/**
 * DTO untuk proses Login
 * Memvalidasi input email dan password dari client
 */
export class LoginDto {
  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(6, { message: 'Password minimal 6 karakter' })
  password: string;
}

/**
 * DTO untuk proses Registrasi User baru
 * Hanya Manajer yang bisa membuat akun baru (diproteksi di controller)
 */
export class RegisterDto {
  @IsString({ message: 'Nama harus berupa string' })
  @IsNotEmpty({ message: 'Nama tidak boleh kosong' })
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name: string;

  @IsEmail({}, { message: 'Format email tidak valid' })
  @IsNotEmpty({ message: 'Email tidak boleh kosong' })
  email: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsNotEmpty({ message: 'Password tidak boleh kosong' })
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(50, { message: 'Password maksimal 50 karakter' })
  password: string;

  @IsEnum(Role, {
    message: `Role harus salah satu dari: ${Object.values(Role).join(', ')}`,
  })
  @IsNotEmpty({ message: 'Role tidak boleh kosong' })
  role: Role;
}

/**
 * DTO untuk response setelah Login berhasil
 * Mengembalikan token JWT dan data user (tanpa password)
 */
export class AuthResponseDto {
  @IsString()
  accessToken: string;

  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
  };
}

/**
 * DTO untuk update profil user (opsional)
 */
export class UpdateProfileDto {
  @IsString({ message: 'Nama harus berupa string' })
  @IsOptional()
  @MaxLength(100, { message: 'Nama maksimal 100 karakter' })
  name?: string;

  @IsString({ message: 'Password harus berupa string' })
  @IsOptional()
  @MinLength(8, { message: 'Password minimal 8 karakter' })
  @MaxLength(50, { message: 'Password maksimal 50 karakter' })
  password?: string;
}
