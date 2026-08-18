import { ValidationError } from 'class-validator';
import { toFieldErrors } from './field-errors';

describe('toFieldErrors', () => {
  it('maps constraints to the field name', () => {
    const errors: ValidationError[] = [
      {
        property: 'email',
        constraints: { isEmail: 'Informe um e-mail válido' },
        children: [],
      },
    ];

    expect(toFieldErrors(errors)).toEqual({
      email: ['Informe um e-mail válido'],
    });
  });

  it('flattens nested fields with a dotted path', () => {
    const errors: ValidationError[] = [
      {
        property: 'venue',
        children: [
          {
            property: 'name',
            constraints: { isString: 'Informe o nome' },
            children: [],
          },
        ],
      },
    ];

    expect(toFieldErrors(errors)).toEqual({
      'venue.name': ['Informe o nome'],
    });
  });
});
