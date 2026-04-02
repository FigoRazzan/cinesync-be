import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContractDto } from './dto/create-contract.dto';
import { ReviewContractDto } from './dto/review-contract.dto';

@Injectable()
export class ContractsService {
  private readonly TOTAL_SHARE = 100;

  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async createContractRequest(producerId: string, dto: CreateContractDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new BadRequestException('Format tanggal tidak valid');
    }

    if (endDate <= startDate) {
      throw new BadRequestException('Tanggal selesai harus setelah tanggal mulai');
    }

    const platformShare = this.TOTAL_SHARE - dto.producerShare;

    const movie = await this.db.movie.create({
      data: {
        title: dto.movieTitle,
        overview: dto.movieOverview,
        posterPath: dto.posterPath,
        genres: [],
        ownerProducerId: producerId,
      },
    });

    return this.db.contract.create({
      data: {
        movieId: movie.id,
        producerId,
        producerShare: dto.producerShare,
        platformShare,
        startDate,
        endDate,
        status: 'PENDING' as never,
        notes: dto.notes,
      },
      include: {
        movie: true,
      },
    });
  }

  async getProducerContracts(producerId: string) {
    return this.db.contract.findMany({
      where: { producerId },
      orderBy: { createdAt: 'desc' },
      include: { movie: true },
    });
  }

  async getPendingContracts() {
    return this.db.contract.findMany({
      where: { status: 'PENDING' as never },
      orderBy: { createdAt: 'asc' },
      include: {
        movie: true,
        producer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async reviewContract(contractId: string, dto: ReviewContractDto) {
    const contract = await this.db.contract.findUnique({
      where: { id: contractId },
      include: { movie: true },
    });

    if (!contract) {
      throw new NotFoundException('Kontrak tidak ditemukan');
    }

    const isApproved = dto.status === 'ACTIVE';

    const updated = await this.db.contract.update({
      where: { id: contractId },
      data: {
        status: dto.status as never,
        approvedAt: isApproved ? new Date() : null,
        rejectedAt: isApproved ? null : new Date(),
        notes: dto.notes ?? contract.notes,
      },
      include: { movie: true },
    });

    if (isApproved) {
      await this.db.movie.update({
        where: { id: contract.movieId },
        data: { isPublished: true },
      });
    }

    return updated;
  }

  async getCatalog() {
    const now = new Date();

    return this.db.contract.findMany({
      where: {
        status: 'ACTIVE' as never,
        startDate: { lte: now },
        endDate: { gte: now },
      },
      include: {
        movie: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
