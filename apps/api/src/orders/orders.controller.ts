import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { PayOrderDto } from './dto/pay-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('pay')
  @Auth(Role.customer)
  @ApiOperation({ summary: 'Pagamento simulado do hold' })
  @ApiCreatedResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente' })
  @ApiNotFoundResponse({ description: 'Hold não encontrado ou expirado' })
  @ApiConflictResponse({ description: 'Hold já convertido em pedido' })
  pay(@CurrentUser() user: AuthUser, @Body() dto: PayOrderDto) {
    return this.ordersService.pay(user.id, dto);
  }
}
