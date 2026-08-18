import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { createTmdbAxios } from './tmdb/tmdb.axios';
import { TmdbClient } from './tmdb/tmdb.client';
import { TMDB_AXIOS } from './tmdb/tmdb.constants';

@Module({
  controllers: [CatalogController],
  providers: [
    CatalogService,
    TmdbClient,
    {
      provide: TMDB_AXIOS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createTmdbAxios(config.getOrThrow<string>('TMDB_API_KEY')),
    },
  ],
  exports: [CatalogService],
})
export class CatalogModule {}
