import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { MAX_TICKETS_PER_ORDER_LIMIT } from '../../events/events.constants';

export class CreateHoldDto {
  @ApiProperty({ example: 'uuid' })
  @IsString({ message: 'validation.eventId.invalid' })
  @MinLength(1, { message: 'validation.eventId.invalid' })
  eventId!: string;

  @ApiProperty({ example: ['F12', 'F13'] })
  @IsArray({ message: 'validation.seatLabels.invalid' })
  @ArrayMinSize(1, { message: 'validation.seatLabels.invalid' })
  @ArrayMaxSize(MAX_TICKETS_PER_ORDER_LIMIT, {
    message: 'validation.seatLabels.invalid',
  })
  @ArrayUnique({ message: 'validation.seatLabels.duplicate' })
  @MinLength(1, { each: true, message: 'validation.seatLabels.invalid' })
  seatLabels!: string[];

  @ApiProperty({ example: 2 })
  @Type(() => Number)
  @IsInt({ message: 'validation.fullCount.invalid' })
  @Min(0, { message: 'validation.fullCount.invalid' })
  fullCount!: number;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt({ message: 'validation.halfCount.invalid' })
  @Min(0, { message: 'validation.halfCount.invalid' })
  halfCount!: number;
}
