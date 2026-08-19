import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [ReservationsModule],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
