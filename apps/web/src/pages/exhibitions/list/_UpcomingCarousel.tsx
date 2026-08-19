import { Carousel } from '@mantine/carousel';
import { Box, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { CatalogMovie } from '@/api/types';
import { AppBadge } from '@/components/UI/AppBadge';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { formatReleaseDateShort } from '@/utils/format';

const POSTER_HEIGHT = 280;

export function UpcomingCarousel({ movies }: { movies: CatalogMovie[] }) {
  const { t } = useTranslation();

  return (
    <Carousel
      slideSize={{ base: '68%', sm: '34%', md: '22%' }}
      slideGap={{ base: 'sm', sm: 'md' }}
      emblaOptions={{ align: 'start', slidesToScroll: 1 }}
      withControls
      controlSize={36}
      classNames={{
        control: 'poster-carousel-control',
        slide: 'poster-carousel-slide',
      }}
    >
      {movies.map((movie) => (
        <Carousel.Slide key={movie.tmdbId}>
          <Box className="poster-carousel-card poster-carousel-card--static">
            <Box pos="relative">
              <MoviePoster
                src={movie.posterUrl}
                alt={movie.title}
                height={POSTER_HEIGHT}
              />
              <AppBadge
                color="brand"
                variant="filled"
                className="poster-carousel-badge"
              >
                {t('exhibitions.list.upcomingBadge')}
              </AppBadge>
            </Box>
            <Stack gap={4} mt="sm" px="xs">
              <Title order={3} fz="h5" lineClamp={2} ta="left">
                {movie.title}
              </Title>
              {formatReleaseDateShort(movie.releaseDate) && (
                <Text size="sm" c="dimmed">
                  {t('exhibitions.list.upcomingRelease', {
                    date: formatReleaseDateShort(movie.releaseDate),
                  })}
                </Text>
              )}
            </Stack>
          </Box>
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}
