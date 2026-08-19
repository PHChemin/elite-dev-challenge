import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import {
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { GateScanDto } from './dto/gate-scan.dto';
import { ListGateEventsQueryDto } from './dto/list-gate-events-query.dto';
import { GateService } from './gate.service';

@ApiTags('gate')
@Controller('gate')
export class GateController {
  constructor(private readonly gateService: GateService) {}

  @Get('events')
  @Auth(Role.gate)
  @ApiOperation({ summary: 'Lista sessões ativas do organizador da portaria' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente ou sem organizador' })
  listEvents(
    @CurrentUser() user: AuthUser,
    @Query() query: ListGateEventsQueryDto,
  ) {
    return this.gateService.listEvents(user.id, query);
  }

  @Post('scan')
  @HttpCode(200)
  @Auth(Role.gate)
  @ApiOperation({ summary: 'Valida ingresso por código QR' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente ou sessão inválida' })
  scan(@CurrentUser() user: AuthUser, @Body() dto: GateScanDto) {
    return this.gateService.scan(user.id, dto);
  }
}
