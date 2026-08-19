import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { MinLength } from 'class-validator';

export class CreateExhibitionDto {
  @ApiProperty({ example: '550', description: 'Filme escolhido no catálogo' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @MinLength(1, { message: 'validation.tmdbId.required' })
  tmdbId!: string;
}
