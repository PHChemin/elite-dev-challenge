import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export const DEFAULT_EXHIBITION_PAGE = 1;
export const DEFAULT_EXHIBITION_PAGE_SIZE = 12;
export const MAX_EXHIBITION_PAGE_SIZE = 48;

export class ListPublishedQueryDto {
  @ApiPropertyOptional({ example: 'clube' })
  @IsOptional()
  @IsString()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  q?: string;

  @ApiPropertyOptional({ example: 1, default: DEFAULT_EXHIBITION_PAGE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.page.invalid' })
  @Min(1, { message: 'validation.page.invalid' })
  page?: number = DEFAULT_EXHIBITION_PAGE;

  @ApiPropertyOptional({ example: 12, default: DEFAULT_EXHIBITION_PAGE_SIZE })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'validation.pageSize.invalid' })
  @Min(1, { message: 'validation.pageSize.invalid' })
  @Max(MAX_EXHIBITION_PAGE_SIZE, { message: 'validation.pageSize.invalid' })
  pageSize?: number = DEFAULT_EXHIBITION_PAGE_SIZE;
}
