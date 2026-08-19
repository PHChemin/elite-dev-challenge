import { Module } from '@nestjs/common';
import { ReservationsModule } from '../reservations/reservations.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ReservationsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
