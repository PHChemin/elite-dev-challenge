import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_GATE_EVENTS_PAGE = 1;
export const DEFAULT_GATE_EVENTS_PAGE_SIZE = 12;
export const MAX_GATE_EVENTS_PAGE_SIZE = 50;

export class ListGateEventsQueryDto {
  @ApiPropertyOptional({ example: 1, default: DEFAULT_GATE_EVENTS_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.page.invalid' })
  @Min(1, { message: 'validation.page.invalid' })
  page?: number = DEFAULT_GATE_EVENTS_PAGE;

  @ApiPropertyOptional({ example: 12, default: DEFAULT_GATE_EVENTS_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.pageSize.invalid' })
  @Min(1, { message: 'validation.pageSize.invalid' })
  @Max(MAX_GATE_EVENTS_PAGE_SIZE, { message: 'validation.pageSize.invalid' })
  pageSize?: number = DEFAULT_GATE_EVENTS_PAGE_SIZE;
}
