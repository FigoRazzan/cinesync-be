import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

interface SeedPlan {
  code: string;
  name: string;
  description: string;
  price: Prisma.Decimal;
  durationDays: number;
}

@Injectable()
export class SubscriptionsService {
  private readonly defaultPlans: SeedPlan[] = [
    {
      code: 'BASIC',
      name: 'Basic',
      description: 'Single device, SD quality',
      price: new Prisma.Decimal(59000),
      durationDays: 30,
    },
    {
      code: 'STANDARD',
      name: 'Standard',
      description: 'Two devices, HD quality',
      price: new Prisma.Decimal(99000),
      durationDays: 30,
    },
    {
      code: 'PREMIUM',
      name: 'Premium',
      description: 'Four devices, UHD quality',
      price: new Prisma.Decimal(149000),
      durationDays: 30,
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  private get db(): any {
    return this.prisma;
  }

  async seedPlans() {
    const existing = await this.db.plan.count();

    if (existing > 0) {
      return;
    }

    await this.db.plan.createMany({
      data: this.defaultPlans,
      skipDuplicates: true,
    });
  }

  async getPlans() {
    await this.seedPlans();

    return this.db.plan.findMany({
      where: { isActive: true },
      orderBy: { price: 'asc' },
    });
  }

  async subscribe(userId: string, planId: string) {
    const plan = await this.db.plan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Paket langganan tidak ditemukan');
    }

    const now = new Date();

    await this.db.subscription.updateMany({
      where: {
        userId,
        status: 'ACTIVE',
      },
      data: {
        status: 'CANCELED',
      },
    });

    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + plan.durationDays);

    return this.db.subscription.create({
      data: {
        userId,
        planId: plan.id,
        status: 'ACTIVE',
        startDate: now,
        endDate,
      },
      include: {
        plan: true,
      },
    });
  }

  async getMySubscription(userId: string) {
    const subscription = await this.db.subscription.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
      include: {
        plan: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!subscription) {
      throw new BadRequestException('Belum ada langganan aktif');
    }

    if (subscription.endDate < new Date()) {
      await this.db.subscription.update({
        where: { id: subscription.id },
        data: { status: 'EXPIRED' },
      });

      throw new BadRequestException('Langganan sudah berakhir');
    }

    return subscription;
  }
}
