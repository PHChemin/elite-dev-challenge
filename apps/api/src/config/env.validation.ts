import { plainToInstance } from 'class-transformer';
import { IsString, MinLength, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  @MinLength(1)
  DATABASE_URL!: string;

  @IsString()
  @MinLength(1)
  JWT_SECRET!: string;

  @IsString()
  @MinLength(1)
  JWT_EXPIRES_IN!: string;

  @IsString()
  @MinLength(1)
  CORS_ORIGIN!: string;

  @IsString()
  TMDB_API_KEY!: string;
}

export function validateEnv(config: Record<string, unknown>) {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validated, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return config;
}
