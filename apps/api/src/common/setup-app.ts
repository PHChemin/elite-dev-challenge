import {
  BadRequestException,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ValidationError } from 'class-validator';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AllExceptionsFilter } from './filters/http-exception.filter';
import { setupSwagger } from './setup-swagger';
import { toFieldErrors } from './validation/field-errors';
import { translateValidationErrors } from './validation/translate-validation-errors';

export function setupApp(app: INestApplication): INestApplication {
  const i18nService = app.get(I18nService);

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      exceptionFactory: (errors: ValidationError[]) => {
        const i18n = I18nContext.current();
        const lang = i18n?.lang ?? 'pt';
        const service = i18n?.service ?? i18nService;
        const translatedErrors = translateValidationErrors(errors, service, lang);
        return new BadRequestException({
          message: service.t('validation.invalidData' as never, { lang }),
          fieldErrors: toFieldErrors(translatedErrors),
        });
      },
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(i18nService));
  setupSwagger(app);

  const config = app.get(ConfigService);
  app.enableCors({ origin: config.get<string>('CORS_ORIGIN') });

  return app;
}
