import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import {
  DEFAULT_MAX_TICKETS_PER_ORDER,
  MAX_EVENTS_PER_REQUEST,
  MAX_TICKETS_PER_ORDER_LIMIT,
} from '../events.constants';

export class CreateEventItemDto {
  @ApiProperty({ example: '2026-09-01T19:00:00.000Z' })
  @IsISO8601({}, { message: 'validation.startsAt.invalid' })
  startsAt!: string;

  @ApiProperty({ example: 'Cine PHC' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1, { message: 'validation.venueName.required' })
  venueName!: string;

  @ApiPropertyOptional({ example: 'Rua A, 100' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'validation.venueAddress.invalid' })
  venueAddress?: string;

  @ApiProperty({ example: 4000, description: 'Preço da inteira' })
  @IsInt({ message: 'validation.priceFull.invalid' })
  @Min(1, { message: 'validation.priceFull.invalid' })
  priceFull!: number;

  @ApiPropertyOptional({
    example: 2000,
    description: 'Preço da meia. Omitido: metade da inteira',
  })
  @IsOptional()
  @IsInt({ message: 'validation.priceHalf.invalid' })
  @Min(0, { message: 'validation.priceHalf.invalid' })
  priceHalf?: number;

  @ApiPropertyOptional({
    example: DEFAULT_MAX_TICKETS_PER_ORDER,
    description: 'Teto de ingressos por compra',
  })
  @IsOptional()
  @IsInt({ message: 'validation.maxTicketsPerOrder.invalid' })
  @Min(1, { message: 'validation.maxTicketsPerOrder.invalid' })
  @Max(MAX_TICKETS_PER_ORDER_LIMIT, {
    message: 'validation.maxTicketsPerOrder.invalid',
  })
  maxTicketsPerOrder?: number;
}

export class CreateEventsDto {
  @ApiProperty({ type: [CreateEventItemDto] })
  @IsArray({ message: 'validation.events.invalid' })
  @ArrayMinSize(1, { message: 'validation.events.invalid' })
  @ArrayMaxSize(MAX_EVENTS_PER_REQUEST, {
    message: 'validation.events.invalid',
  })
  @ValidateNested({ each: true })
  @Type(() => CreateEventItemDto)
  events!: CreateEventItemDto[];
}
