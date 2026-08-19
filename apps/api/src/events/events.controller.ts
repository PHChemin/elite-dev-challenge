import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import type { AuthUser } from '../auth/types/auth-user';
import { ReservationsService } from '../reservations/reservations.service';
import { CreateEventsDto } from './dto/create-events.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { EventsService } from './events.service';

@ApiTags('events')
@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly reservationsService: ReservationsService,
  ) {}

  @Get('events/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Detalhe público da sessão publicada' })
  @ApiOkResponse()
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  findPublished(@Param('id') id: string, @CurrentUser() user?: AuthUser) {
    return this.reservationsService.findPublishedEvent(
      id,
      user?.role === Role.customer ? user.id : undefined,
    );
  }

  @Post('exhibitions/:exhibitionId/events')
  @Auth(Role.organizer)
  @ApiOperation({
    summary: 'Cria um ou vários eventos do cartaz e gera os assentos',
  })
  @ApiCreatedResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Cartaz de outro organizador' })
  @ApiNotFoundResponse({ description: 'Cartaz não encontrado' })
  @ApiConflictResponse({
    description: 'Já existe evento neste horário e local',
  })
  createEvents(
    @CurrentUser() user: AuthUser,
    @Param('exhibitionId') exhibitionId: string,
    @Body() dto: CreateEventsDto,
  ) {
    return this.eventsService.createMany(user.id, exhibitionId, dto.events);
  }

  @Patch('events/:id')
  @Auth(Role.organizer)
  @ApiOperation({ summary: 'Edita o evento e publica' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Evento de outro organizador' })
  @ApiNotFoundResponse({ description: 'Evento não encontrado' })
  @ApiConflictResponse({
    description: 'Já existe evento neste horário e local',
  })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(user.id, id, dto);
  }
}
