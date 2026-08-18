import { Test, TestingModule } from '@nestjs/testing';
import { I18nService } from 'nestjs-i18n';
import { AppController } from './app.controller';
import { PrismaService } from './prisma/prisma.service';

describe('AppController', () => {
  let controller: AppController;
  const prisma = {
    $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        { provide: PrismaService, useValue: prisma },
        { provide: I18nService, useValue: { t: (key: string) => key } },
      ],
    }).compile();

    controller = module.get(AppController);
  });

  it('returns ok when the database responds', async () => {
    await expect(controller.health()).resolves.toEqual({ status: 'ok' });
  });
});
