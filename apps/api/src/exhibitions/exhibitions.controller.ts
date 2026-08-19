import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
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
import { CreateExhibitionDto } from './dto/create-exhibition.dto';
import { ListPublishedQueryDto } from './dto/list-published-query.dto';
import { UpdateExhibitionDto } from './dto/update-exhibition.dto';
import { ExhibitionsService } from './exhibitions.service';

const LIST_EXAMPLE = {
  id: 'uuid',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  nextStartsAt: '2026-09-01T19:00:00.000Z',
  eventCount: 1,
};

const PUBLIC_DETAIL_EXAMPLE = {
  id: 'uuid',
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: LIST_EXAMPLE.posterUrl,
  events: [
    {
      id: 'uuid',
      startsAt: '2026-09-01T19:00:00.000Z',
      venueName: 'Cine PHC',
      venueAddress: 'Rua A, 100',
      priceFull: 4000,
      priceHalf: 2000,
      maxTicketsPerOrder: 6,
    },
  ],
};

@ApiTags('exhibitions')
@Controller('exhibitions')
export class ExhibitionsController {
  constructor(private readonly exhibitionsService: ExhibitionsService) {}

  @Get()
  @ApiOperation({ summary: 'Lista cartazes publicados com busca e paginação' })
  @ApiOkResponse({
    schema: {
      example: {
        items: [LIST_EXAMPLE],
        page: 1,
        pageSize: 12,
        total: 1,
        totalPages: 1,
      },
    },
  })
  listPublished(@Query() query: ListPublishedQueryDto) {
    return this.exhibitionsService.listPublished(query);
  }

  @Get('mine')
  @Auth(Role.organizer)
  @ApiOperation({ summary: 'Lista os cartazes do organizador' })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente' })
  listMine(@CurrentUser() user: AuthUser) {
    return this.exhibitionsService.listByOrganizer(user.id);
  }

  @Get('mine/:id')
  @Auth(Role.organizer)
  @ApiOperation({
    summary: 'Detalhe do cartaz do organizador, com todos os eventos',
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Cartaz de outro organizador' })
  @ApiNotFoundResponse({ description: 'Cartaz não encontrado' })
  findMine(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.exhibitionsService.findByOrganizer(user.id, id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe do cartaz publicado e eventos publicados' })
  @ApiOkResponse({ schema: { example: PUBLIC_DETAIL_EXAMPLE } })
  @ApiNotFoundResponse({ description: 'Cartaz não encontrado' })
  findPublished(@Param('id') id: string) {
    return this.exhibitionsService.findPublished(id);
  }

  @Post()
  @Auth(Role.organizer)
  @ApiOperation({ summary: 'Cria o cartaz a partir de um filme do catálogo' })
  @ApiCreatedResponse({
    schema: {
      example: { ...LIST_EXAMPLE, tmdbId: '550', publishStatus: 'draft' },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente' })
  @ApiNotFoundResponse({ description: 'Filme não encontrado no catálogo' })
  @ApiConflictResponse({ description: 'Filme já tem cartaz neste organizador' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExhibitionDto) {
    return this.exhibitionsService.create(user.id, dto);
  }

  @Patch(':id')
  @Auth(Role.organizer)
  @ApiOperation({ summary: 'Edita o filme (sem eventos) e publica o cartaz' })
  @ApiOkResponse()
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Cartaz de outro organizador' })
  @ApiNotFoundResponse({ description: 'Cartaz não encontrado' })
  @ApiConflictResponse({
    description: 'Não é possível trocar o filme com eventos',
  })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateExhibitionDto,
  ) {
    return this.exhibitionsService.update(user.id, id, dto);
  }
}
