import {
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import type { PublicExhibitionDetail } from '@/api/types';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { formatReleaseYear, formatRuntime } from '@/utils/format';

const POSTER_WIDTH = 220;
const POSTER_HEIGHT = 330;

export function ExhibitionHero({ data }: { data: PublicExhibitionDetail }) {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const year = formatReleaseYear(data.releaseDate);
  const runtime = formatRuntime(data.runtimeMinutes);
  const genres = data.genres.slice(0, 3);
  const hasOverview = Boolean(data.overview?.trim());

  return (
    <>
      <Group align="flex-start" gap="xl" wrap="wrap">
        <MoviePoster
          src={data.posterUrl}
          alt={data.title}
          width={POSTER_WIDTH}
          height={POSTER_HEIGHT}
        />
        <Stack gap="md" flex={1} miw={240}>
          <Title order={1} fz={{ base: 'h3', sm: 'h2' }} ta="left">
            {data.title}
            {year ? ` (${year})` : ''}
          </Title>
          {(runtime || genres.length > 0) && (
            <Group gap="xs">
              {runtime && (
                <Badge variant="light" color="brand">
                  {runtime}
                </Badge>
              )}
              {genres.map((genre) => (
                <Badge key={genre.id} variant="outline" color="gray">
                  {genre.name}
                </Badge>
              ))}
            </Group>
          )}
          {hasOverview && (
            <Stack gap="xs">
              <Text size="sm" lineClamp={3}>
                {data.overview}
              </Text>
              {data.overview && data.overview.length > 180 && (
                <Button variant="subtle" size="compact-sm" onClick={open}>
                  {t('exhibitions.detail.readMore')}
                </Button>
              )}
            </Stack>
          )}
        </Stack>
      </Group>

      {hasOverview && (
        <Modal
          opened={opened}
          onClose={close}
          title={data.title}
          size="lg"
        >
          <Text size="sm">{data.overview}</Text>
        </Modal>
      )}
    </>
  );
}
