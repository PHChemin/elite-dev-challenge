import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './http-exception.filter';

function createHost(path = '/api/auth/login'): {
  host: ArgumentsHost;
  json: jest.Mock;
} {
  const json = jest.fn();
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({
        status: jest.fn().mockReturnValue({ json }),
      }),
      getRequest: () => ({ originalUrl: path, url: path }),
    }),
  } as unknown as ArgumentsHost;
  return { host, json };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it('forwards fieldErrors from a validation exception', () => {
    const { host, json } = createHost();
    const fieldErrors = { email: ['Informe um e-mail válido'] };

    filter.catch(
      new BadRequestException({
        message: 'Dados inválidos',
        fieldErrors,
      }),
      host,
    );

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/auth/login',
        message: 'Dados inválidos',
        fieldErrors,
      }),
    );
  });

  it('returns an empty fieldErrors object when the exception has none', () => {
    const { host, json } = createHost('/api/users/me');

    filter.catch(new BadRequestException('Token ausente'), host);

    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 400,
        path: '/api/users/me',
        message: 'Token ausente',
        fieldErrors: {},
      }),
    );
  });
});
