import { ValidationError } from 'class-validator';

export type FieldErrors = Record<string, string[]>;

export function toFieldErrors(
  errors: ValidationError[],
  parent = '',
): FieldErrors {
  const result: FieldErrors = {};

  for (const error of errors) {
    const path = parent ? `${parent}.${error.property}` : error.property;
    if (error.constraints) {
      result[path] = Object.values(error.constraints);
    }
    if (error.children?.length) {
      Object.assign(result, toFieldErrors(error.children, path));
    }
  }

  return result;
}
