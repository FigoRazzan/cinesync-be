import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateContractDto {
  @IsString()
  @IsNotEmpty()
  movieTitle: string;

  @IsOptional()
  @IsString()
  movieOverview?: string;

  @IsOptional()
  @IsString()
  posterPath?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsNumber()
  @Min(1)
  @Max(99)
  producerShare: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
