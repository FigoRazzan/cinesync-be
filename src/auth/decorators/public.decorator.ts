import { SetMetadata } from '@nestjs/common';

/**
 * Kunci metadata untuk menandai endpoint sebagai publik (tanpa autentikasi)
 * Digunakan oleh JwtAuthGuard untuk melewati proses validasi token
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator @Public() - Menandai endpoint sebagai publik
 *
 * Endpoint yang ditandai @Public() akan melewati JwtAuthGuard,
 * sehingga bisa diakses tanpa token JWT.
 *
 * Contoh penggunaan:
 * @Public()
 * @Post('login')
 * login(@Body() dto: LoginDto) { ... }
 *
 * @Public()
 * @Post('register')
 * register(@Body() dto: RegisterDto) { ... }
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
