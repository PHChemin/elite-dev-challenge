import { join } from 'path';
import { LocalesJsonLoader } from './locales-json.loader';

describe('LocalesJsonLoader', () => {
  const loader = new LocalesJsonLoader({ path: join(__dirname) });

  it('loads nested keys from pt.json', async () => {
    await expect(loader.languages()).resolves.toEqual(['pt']);
    await expect(loader.load()).resolves.toMatchObject({
      pt: {
        validation: {
          invalidData: 'Dados inválidos',
          email: { invalid: 'Informe um e-mail válido' },
        },
        auth: { invalidCredentials: 'Credenciais inválidas' },
        catalog: { tmdbUnavailable: 'Catálogo TMDb indisponível' },
        errors: { internal: 'Erro interno' },
      },
    });
  });
});
