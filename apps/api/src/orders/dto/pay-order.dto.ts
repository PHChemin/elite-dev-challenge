import { ApiProperty } from '@nestjs/swagger';
import { PaymentStatus } from '@prisma/client';
import { IsEnum, IsString, MinLength } from 'class-validator';

export class PayOrderDto {
  @ApiProperty({ example: 'uuid' })
  @IsString({ message: 'validation.holdId.invalid' })
  @MinLength(1, { message: 'validation.holdId.invalid' })
  holdId!: string;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.approved })
  @IsEnum(PaymentStatus, { message: 'validation.result.invalid' })
  result!: PaymentStatus;
}
