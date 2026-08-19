import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('mine')
  @Auth(Role.customer)
  @ApiOperation({ summary: 'Lista os ingressos do consumidor' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.ticketsService.listMine(user.id);
  }

  @Get('share/:shareToken')
  @UseGuards(ThrottlerGuard)
  @ApiOperation({ summary: 'Detalhe público de um ingresso pelo shareToken' })
  @ApiOkResponse()
  @ApiNotFoundResponse({ description: 'Ingresso não encontrado' })
  @ApiTooManyRequestsResponse({ description: 'Muitas requisições' })
  findByShareToken(@Param('shareToken') shareToken: string) {
    return this.ticketsService.findByShareToken(shareToken);
  }
}
