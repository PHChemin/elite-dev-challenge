import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MinLength } from 'class-validator';

export class SearchMoviesQueryDto {
  @ApiProperty({ example: 'clube da luta' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1, { message: 'validation.query.required' })
  q!: string;
}
