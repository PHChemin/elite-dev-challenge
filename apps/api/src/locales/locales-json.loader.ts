import { Inject, Injectable } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';
import {
  I18N_LOADER_OPTIONS,
  I18nLoader,
  type I18nTranslation,
} from 'nestjs-i18n';

export type LocalesJsonLoaderOptions = {
  path: string;
};

@Injectable()
export class LocalesJsonLoader extends I18nLoader {
  constructor(
    @Inject(I18N_LOADER_OPTIONS)
    private readonly options: LocalesJsonLoaderOptions,
  ) {
    super();
  }

  languages(): Promise<string[]> {
    return Promise.resolve(['pt']);
  }

  async load(): Promise<I18nTranslation> {
    const source = await readFile(join(this.options.path, 'pt.json'), 'utf8');
    return { pt: JSON.parse(source) as I18nTranslation['pt'] };
  }
}
