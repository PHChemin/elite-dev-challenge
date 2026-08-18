import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PublishStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateEventItemDto } from './create-events.dto';

export class UpdateEventDto extends PartialType(CreateEventItemDto) {
  @ApiPropertyOptional({
    enum: PublishStatus,
    example: PublishStatus.published,
  })
  @IsOptional()
  @IsEnum(PublishStatus, { message: 'validation.publishStatus.invalid' })
  publishStatus?: PublishStatus;
}
