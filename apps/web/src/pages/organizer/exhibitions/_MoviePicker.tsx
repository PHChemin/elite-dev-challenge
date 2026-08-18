import {
  Button,
  Group,
  NavLink,
  Paper,
  ScrollArea,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { mdiMagnify, mdiSwapHorizontal } from '@mdi/js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { searchMovies } from '@/api/catalog';
import { ApiError } from '@/api/client';
import type { CatalogMovie } from '@/api/types';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppIcon } from '@/components/UI/AppIcon';

const RESULT_POSTER_WIDTH = 46;
const RESULT_POSTER_HEIGHT = 69;
const SELECTED_POSTER_WIDTH = 80;
const SELECTED_POSTER_HEIGHT = 120;
const RESULTS_MAX_HEIGHT = 280;

type MoviePickerProps = {
  selected: CatalogMovie | null;
  error?: string;
  onSelect: (movie: CatalogMovie | null) => void;
};

/** Busca no catálogo TMDb e escolha do filme do cartaz. */
export function MoviePicker({ selected, error, onSelect }: MoviePickerProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<CatalogMovie[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function search() {
    if (query.trim().length === 0) {
      return;
    }
    setSearching(true);
    try {
      setResults(await searchMovies(query.trim()));
    } catch (cause) {
      setResults(null);
      notifications.show({
        title: t('catalog.searchFailed'),
        message:
          cause instanceof ApiError
            ? cause.message
            : t('errors.api.requestFailed'),
        color: 'brand.4',
      });
    } finally {
      setSearching(false);
    }
  }

  if (selected) {
    return (
      <Paper p="md" withBorder>
        <Group align="flex-start" gap="md" wrap="nowrap">
          <MoviePoster
            src={selected.posterUrl}
            alt={selected.title}
            width={SELECTED_POSTER_WIDTH}
            height={SELECTED_POSTER_HEIGHT}
          />
          <Stack gap={4} flex={1}>
            <Text fw={500}>{selected.title}</Text>
            {selected.releaseDate && (
              <Text size="sm" c="dimmed">
                {selected.releaseDate.slice(0, 4)}
              </Text>
            )}
            <Button
              variant="subtle"
              size="compact-sm"
              w="fit-content"
              px={0}
              leftSection={<AppIcon path={mdiSwapHorizontal} />}
              onClick={() => {
                onSelect(null);
                setResults(null);
              }}
            >
              {t('catalog.changeMovie')}
            </Button>
          </Stack>
        </Group>
      </Paper>
    );
  }

  return (
    <Stack gap="sm">
      <Group align="flex-end" gap="sm" wrap="nowrap">
        <TextInput
          flex={1}
          label={t('catalog.searchLabel')}
          placeholder={t('catalog.searchPlaceholder')}
          value={query}
          error={error}
          onChange={(event) => setQuery(event.currentTarget.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void search();
            }
          }}
        />
        <Button
          variant="outline"
          loading={searching}
          leftSection={<AppIcon path={mdiMagnify} />}
          onClick={() => void search()}
        >
          {t('catalog.searchAction')}
        </Button>
      </Group>

      {results && results.length === 0 && (
        <Text size="sm" c="dimmed">
          {t('catalog.noResults')}
        </Text>
      )}

      {results && results.length > 0 && (
        <ScrollArea.Autosize mah={RESULTS_MAX_HEIGHT} type="auto">
          {results.map((movie) => (
            <NavLink
              key={movie.tmdbId}
              onClick={() => onSelect(movie)}
              label={movie.title}
              description={movie.releaseDate?.slice(0, 4)}
              leftSection={
                <MoviePoster
                  src={movie.posterUrl}
                  alt={movie.title}
                  width={RESULT_POSTER_WIDTH}
                  height={RESULT_POSTER_HEIGHT}
                />
              }
            />
          ))}
        </ScrollArea.Autosize>
      )}
    </Stack>
  );
}
