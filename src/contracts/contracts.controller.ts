import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CurrentUser, Public, Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateContractDto } from './dto/create-contract.dto';
import { ReviewContractDto } from './dto/review-contract.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Public()
  @Get('catalog')
  async getCatalog() {
    return this.contractsService.getCatalog();
  }

  @Roles('PRODUCER')
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createContract(
    @CurrentUser('id') producerId: string,
    @Body() dto: CreateContractDto,
  ) {
    return this.contractsService.createContractRequest(producerId, dto);
  }

  @Roles('PRODUCER')
  @Get('my')
  async getMyContracts(@CurrentUser('id') producerId: string) {
    return this.contractsService.getProducerContracts(producerId);
  }

  @Roles('ADMIN')
  @Get('pending')
  async getPendingContracts() {
    return this.contractsService.getPendingContracts();
  }

  @Roles('ADMIN')
  @Patch(':contractId/review')
  async reviewContract(
    @Param('contractId', ParseUUIDPipe) contractId: string,
    @Body() dto: ReviewContractDto,
  ) {
    return this.contractsService.reviewContract(contractId, dto);
  }
}
