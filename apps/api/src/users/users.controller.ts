import { Controller, Get } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Auth } from '../auth/decorators/auth.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @Auth()
  @ApiOperation({ summary: 'Perfil do usuário autenticado' })
  @ApiOkResponse({
    description: 'Dados do perfil sem hash de senha',
    schema: {
      example: {
        id: 'uuid',
        email: 'customer@phctickets.local',
        role: 'customer',
        status: 'active',
        organizerId: null,
        mustChangePassword: false,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  me(@CurrentUser() user: AuthUser) {
    return this.usersService.findMe(user.id);
  }
}
