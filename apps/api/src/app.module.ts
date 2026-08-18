import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AcceptLanguageResolver, I18nModule } from 'nestjs-i18n';
import { join } from 'path';
import { AppController } from './app.controller';
import { AuthModule } from './auth/auth.module';
import { CatalogModule } from './catalog/catalog.module';
import { validateEnv } from './config/env.validation';
import { EventsModule } from './events/events.module';
import { ExhibitionsModule } from './exhibitions/exhibitions.module';
import { LocalesJsonLoader } from './locales/locales-json.loader';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'pt',
      loader: LocalesJsonLoader,
      loaderOptions: {
        path: join(__dirname, 'locales'),
      },
      resolvers: [AcceptLanguageResolver],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CatalogModule,
    ExhibitionsModule,
    EventsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
