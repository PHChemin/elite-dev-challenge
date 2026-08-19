import { Divider, Group, Paper, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getPublishedExhibition } from '@/api/exhibitions';
import { useApiResource } from '@/api/useApiResource';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { ROUTES } from '@/routes/routes';
import {
  calendarDayKey,
  dayOptionsFromStartsAt,
  defaultDayKey,
} from '@/utils/format';
import { EventCard } from './_EventCard';
import { EventDayStrip } from './_EventDayStrip';

const POSTER_WIDTH = 220;
const POSTER_HEIGHT = 330;

export function ExhibitionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const load = useCallback(() => getPublishedExhibition(id ?? ''), [id]);
  const { data, loading, error, reload } = useApiResource(load);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const days = useMemo(
    () =>
      dayOptionsFromStartsAt(
        data?.events.map((event) => event.startsAt) ?? [],
      ),
    [data],
  );
  const activeDay =
    selectedDay && days.some((day) => day.key === selectedDay)
      ? selectedDay
      : defaultDayKey(days);
  const dayEvents = (data?.events ?? [])
    .filter((event) => calendarDayKey(event.startsAt) === activeDay)
    .sort((left, right) => left.startsAt.localeCompare(right.startsAt));

  return (
    <Stack gap="lg">
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && (
          <Stack gap="lg">
            <PageBreadcrumbs
              items={[
                { label: t('nav.home'), to: ROUTES.exhibitions },
                { label: data.title },
              ]}
            />
            <Paper p={{ base: 'md', sm: 'xl' }}>
              <Stack gap="lg">
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
                    </Title>
                  </Stack>
                </Group>
                <Divider />
                <Title order={2} fz="h4" ta="left">
                  {t('exhibitions.detail.events')}
                </Title>
                {data.events.length > 0 ? (
                  <Stack gap="md">
                    <EventDayStrip
                      days={days}
                      selected={activeDay}
                      onSelect={setSelectedDay}
                    />
                    {dayEvents.length > 0 ? (
                      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                        {dayEvents.map((event) => (
                          <EventCard
                            key={event.id}
                            exhibitionId={data.id}
                            event={event}
                          />
                        ))}
                      </SimpleGrid>
                    ) : (
                      <Text c="dimmed">
                        {t('exhibitions.detail.emptyDay')}
                      </Text>
                    )}
                  </Stack>
                ) : (
                  <Text c="dimmed">{t('exhibitions.detail.emptyEvents')}</Text>
                )}
              </Stack>
            </Paper>
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
