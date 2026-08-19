import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { HOLD_CLEANUP_INTERVAL_MS } from './reservations.constants';
import { ReservationsService } from './reservations.service';

@Injectable()
export class ReservationsCleanupService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(ReservationsCleanupService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly reservationsService: ReservationsService) {}

  onModuleInit(): void {
    if (process.env.NODE_ENV === 'test') {
      return;
    }
    this.timer = setInterval(() => {
      void this.tick();
    }, HOLD_CLEANUP_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  private async tick(): Promise<void> {
    try {
      await this.reservationsService.releaseExpired();
    } catch (error) {
      this.logger.error(error);
    }
  }
}
