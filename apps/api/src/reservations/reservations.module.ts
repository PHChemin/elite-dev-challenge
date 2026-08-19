import { Module } from '@nestjs/common';
import { ReservationsCleanupService } from './reservations.cleanup';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService, ReservationsCleanupService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
