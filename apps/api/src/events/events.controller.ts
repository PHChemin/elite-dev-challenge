import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista sessões publicadas' })
  @ApiOkResponse({
    description: 'Sessões gravadas no banco, sem consulta à TMDb',
    schema: {
      example: [
        {
          id: 'uuid',
          title: 'Clube da Luta',
          posterUrl:
            'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          startsAt: '2026-09-01T19:00:00.000Z',
          venueName: 'Cine PHC',
          venueAddress: 'Rua A, 100',
          priceFull: 4000,
          priceHalf: 2000,
          maxTicketsPerOrder: 6,
        },
      ],
    },
  })
  listPublished() {
    return this.eventsService.listPublished();
  }
}
