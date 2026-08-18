import { Injectable } from '@nestjs/common';
import { PublishStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  listPublished() {
    return this.prisma.event.findMany({
      where: { publishStatus: PublishStatus.published },
      orderBy: { startsAt: 'asc' },
      select: {
        id: true,
        title: true,
        posterUrl: true,
        startsAt: true,
        venueName: true,
        venueAddress: true,
        priceFull: true,
        priceHalf: true,
        maxTicketsPerOrder: true,
      },
    });
  }
}
