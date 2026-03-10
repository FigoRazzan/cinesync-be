import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * PrismaModule - Modul global untuk menyediakan PrismaService ke seluruh aplikasi
 * Dengan decorator @Global(), modul ini tidak perlu di-import ulang di setiap modul lain
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
