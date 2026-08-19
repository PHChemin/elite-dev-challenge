import { Carousel } from '@mantine/carousel';
import { Box, Stack, Text, Title } from '@mantine/core';
import { Link } from 'react-router-dom';
import type { ExhibitionSummary } from '@/api/types';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { toExhibitionDetail } from '@/routes/routes';
import { formatDateTime } from '@/utils/format';

const POSTER_HEIGHT = 320;

export function ExhibitionCarousel({
  exhibitions,
}: {
  exhibitions: ExhibitionSummary[];
}) {
  return (
    <Carousel
      slideSize={{ base: '72%', sm: '38%', md: '24%' }}
      slideGap={{ base: 'sm', sm: 'md' }}
      emblaOptions={{ align: 'center', loop: true, slidesToScroll: 1 }}
      withControls
      controlSize={36}
      classNames={{
        control: 'poster-carousel-control',
        slide: 'poster-carousel-slide',
      }}
    >
      {exhibitions.map((exhibition) => (
        <Carousel.Slide key={exhibition.id}>
          <Box
            component={Link}
            to={toExhibitionDetail(exhibition.id)}
            className="poster-carousel-card"
            aria-label={exhibition.title}
          >
            <MoviePoster
              src={exhibition.posterUrl}
              alt={exhibition.title}
              height={POSTER_HEIGHT}
            />
            <Stack gap={4} mt="sm" px="xs">
              <Title order={3} fz="h5" lineClamp={2} ta="left">
                {exhibition.title}
              </Title>
              {exhibition.nextStartsAt && (
                <Text size="sm" c="dimmed">
                  {formatDateTime(exhibition.nextStartsAt)}
                </Text>
              )}
            </Stack>
          </Box>
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}
