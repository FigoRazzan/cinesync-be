import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { CurrentUser, Public, Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SubscribeDto } from './dto/subscribe.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  async getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @Roles('USER')
  @Post('subscribe')
  @HttpCode(HttpStatus.CREATED)
  async subscribe(
    @CurrentUser('id') userId: string,
    @Body() dto: SubscribeDto,
  ) {
    return this.subscriptionsService.subscribe(userId, dto.planId);
  }

  @Roles('USER')
  @Get('me')
  async getMySubscription(@CurrentUser('id') userId: string) {
    return this.subscriptionsService.getMySubscription(userId);
  }
}
