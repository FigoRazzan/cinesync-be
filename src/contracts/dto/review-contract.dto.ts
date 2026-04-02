import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ContractReviewStatus {
  ACTIVE = 'ACTIVE',
  REJECTED = 'REJECTED',
}

export class ReviewContractDto {
  @IsEnum(ContractReviewStatus)
  status: ContractReviewStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
