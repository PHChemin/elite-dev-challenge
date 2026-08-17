import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'organizer@phctickets.local' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'validation.email.invalid' })
  email!: string;

  @ApiProperty({ example: 'organizer123' })
  @IsString({ message: 'validation.password.required' })
  @MinLength(1, { message: 'validation.password.required' })
  password!: string;
}
