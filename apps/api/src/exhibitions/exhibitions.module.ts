import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module';
import { ExhibitionsController } from './exhibitions.controller';
import { ExhibitionsService } from './exhibitions.service';

@Module({
  imports: [CatalogModule],
  controllers: [ExhibitionsController],
  providers: [ExhibitionsService],
})
export class ExhibitionsModule {}
