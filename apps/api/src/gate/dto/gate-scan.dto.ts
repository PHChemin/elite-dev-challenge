import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MinLength } from 'class-validator';

export class GateScanDto {
  @ApiProperty({ example: 'uuid' })
  @IsString({ message: 'validation.eventId.invalid' })
  @MinLength(1, { message: 'validation.eventId.invalid' })
  eventId!: string;

  @ApiProperty({ example: 'a'.repeat(32) })
  @IsString()
  @MinLength(1, { message: 'validation.code.invalid' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  code!: string;
}
