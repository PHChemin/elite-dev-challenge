import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { setupSwagger } from './setup-swagger';
import { toFieldErrors } from './validation/field-errors';

export function setupApp(app: INestApplication): INestApplication {
  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) =>
        new BadRequestException({
          message: 'Dados inválidos',
          fieldErrors: toFieldErrors(errors),
        }),
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());
  setupSwagger(app);

  const config = app.get(ConfigService);
  const origin = config.get<string>('CORS_ORIGIN');
  app.enableCors({ origin, credentials: true });

  return app;
}
