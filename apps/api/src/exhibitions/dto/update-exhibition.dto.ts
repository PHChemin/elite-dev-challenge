import { ApiPropertyOptional } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsOptional, MinLength } from 'class-validator';

export class UpdateExhibitionDto {
  @ApiPropertyOptional({ example: '550' })
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1, { message: 'validation.tmdbId.required' })
  tmdbId?: string;

  @ApiPropertyOptional({
    enum: PublishStatus,
    example: PublishStatus.published,
  })
  @IsOptional()
  @IsEnum(PublishStatus, { message: 'validation.publishStatus.invalid' })
  publishStatus?: PublishStatus;
}
