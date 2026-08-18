import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CatalogService } from './catalog.service';
import { SearchMoviesQueryDto } from './dto/search-movies-query.dto';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('movies')
  @Auth(Role.organizer)
  @ApiOperation({ summary: 'Busca filmes na TMDb para montar a sessão' })
  @ApiOkResponse({
    description: 'Título, poster e id TMDb',
    schema: {
      example: {
        results: [
          {
            tmdbId: '550',
            title: 'Clube da Luta',
            posterUrl:
              'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
            releaseDate: '1999-10-15',
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Token ausente ou inválido' })
  @ApiForbiddenResponse({ description: 'Papel insuficiente' })
  @ApiBadGatewayResponse({ description: 'TMDb indisponível' })
  search(@Query() query: SearchMoviesQueryDto) {
    return this.catalogService.search(query.q);
  }
}
