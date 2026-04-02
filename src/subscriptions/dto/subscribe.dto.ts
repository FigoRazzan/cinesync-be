import { IsNotEmpty, IsUUID } from 'class-validator';

export class SubscribeDto {
  @IsUUID()
  @IsNotEmpty()
  planId: string;
}
