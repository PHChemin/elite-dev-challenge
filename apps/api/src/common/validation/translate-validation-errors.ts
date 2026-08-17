import { ValidationError } from 'class-validator';
import type { I18nService } from 'nestjs-i18n';

export function translateValidationErrors(
  errors: ValidationError[],
  i18n: I18nService,
  lang: string,
): ValidationError[] {
  return errors.map((error) => ({
    ...error,
    constraints: error.constraints
      ? Object.fromEntries(
          Object.entries(error.constraints).map(([key, message]) => [
            key,
            i18n.t(message as never, { lang }),
          ]),
        )
      : undefined,
    children: error.children?.length
      ? translateValidationErrors(error.children, i18n, lang)
      : error.children,
  }));
}
