import { Body, Controller, Get, Param, Post } from '@nestjs/common';
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
import type { AuthUser } from '../auth/types/auth-user';
import { CreateHoldDto } from './dto/create-hold.dto';
import { ReservationsService } from './reservations.service';

@ApiTags('reservations')
@Controller()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Get('events/:id/seats')
  @Auth(Role.customer)
  @ApiOperation({ summary: 'Mapa de ocupação da sessão publicada' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  listSeats(@Param('id') id: string, @CurrentUser() user: AuthUser) {
    return this.reservationsService.listSeats(id, user.id);
  }

  @Post('reservations/holds')
  @Auth(Role.customer)
  @ApiOperation({ summary: 'Retém assentos por 10 minutos' })
  @ApiCreatedResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente' })
  @ApiNotFoundResponse({ description: 'Sessão não encontrada' })
  @ApiConflictResponse({ description: 'Assento indisponível' })
  createHold(@CurrentUser() user: AuthUser, @Body() dto: CreateHoldDto) {
    return this.reservationsService.createHold(user.id, dto);
  }

  @Get('reservations/holds/mine')
  @Auth(Role.customer)
  @ApiOperation({ summary: 'Lista pedidos pendentes do consumidor' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente' })
  listMineHolds(@CurrentUser() user: AuthUser) {
    return this.reservationsService.listMineHolds(user.id);
  }

  @Get('reservations/holds/:id')
  @Auth(Role.customer)
  @ApiOperation({ summary: 'Pedido pendente do consumidor' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Hold de outro consumidor' })
  @ApiNotFoundResponse({ description: 'Hold não encontrado ou expirado' })
  findMine(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.reservationsService.findMine(user.id, id);
  }
}
