import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBadGatewayResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Auth } from '../auth/decorators/auth.decorator';
import { CatalogService } from './catalog.service';
import { SearchMoviesQueryDto } from './dto/search-movies-query.dto';
import { UpcomingMoviesQueryDto } from './dto/upcoming-movies-query.dto';

const MOVIE_EXAMPLE = {
  tmdbId: '550',
  title: 'Clube da Luta',
  posterUrl: 'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  releaseDate: '1999-10-15',
  runtimeMinutes: 139,
  overview: 'Um funcionário de escritório forma um clube de luta clandestino.',
  genres: [{ id: 18, name: 'Drama' }],
};

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Get('upcoming')
  @ApiOperation({ summary: 'Lançamentos futuros na TMDb' })
  @ApiOkResponse({
    schema: {
      example: {
        results: [MOVIE_EXAMPLE],
        page: 1,
        totalPages: 1,
      },
    },
  })
  upcoming(@Query() query: UpcomingMoviesQueryDto) {
    return this.catalogService.getUpcoming(query.page ?? 1);
  }

  @Get('movies/:tmdbId/credits')
  @ApiOperation({ summary: 'Elenco de um filme na TMDb' })
  @ApiOkResponse({
    schema: {
      example: {
        cast: [
          {
            name: 'Brad Pitt',
            character: 'Tyler Durden',
            profileUrl:
              'https://image.tmdb.org/t/p/w500/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
          },
        ],
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Filme não encontrado no catálogo' })
  @ApiBadGatewayResponse({ description: 'TMDb indisponível' })
  credits(@Param('tmdbId') tmdbId: string) {
    return this.catalogService.getMovieCredits(tmdbId);
  }

  @Get('movies')
  @Auth(Role.organizer)
  @ApiOperation({ summary: 'Busca filmes na TMDb para montar a sessão' })
  @ApiOkResponse({
    description: 'Título, poster e id TMDb',
    schema: {
      example: {
        results: [MOVIE_EXAMPLE],
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
