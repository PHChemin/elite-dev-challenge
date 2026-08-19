import { Divider, Paper, SimpleGrid, Stack, Tabs, Text } from '@mantine/core';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { getPublishedExhibition } from '@/api/exhibitions';
import { useApiResource } from '@/api/useApiResource';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { ROUTES } from '@/routes/routes';
import {
  calendarDayKey,
  dayOptionsFromStartsAt,
  defaultDayKey,
} from '@/utils/format';
import { CastTab } from './_CastTab';
import { EventCard } from './_EventCard';
import { EventDayStrip } from './_EventDayStrip';
import { ExhibitionHero } from './_ExhibitionHero';

export function ExhibitionDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const load = useCallback(() => getPublishedExhibition(id ?? ''), [id]);
  const { data, loading, error, reload } = useApiResource(load);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>('sessions');

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
                <ExhibitionHero data={data} />
                <Divider />
                <Tabs value={activeTab} onChange={setActiveTab}>
                  <Tabs.List>
                    <Tabs.Tab value="sessions">
                      {t('exhibitions.detail.events')}
                    </Tabs.Tab>
                    <Tabs.Tab value="cast">
                      {t('exhibitions.detail.castTitle')}
                    </Tabs.Tab>
                  </Tabs.List>

                  <Tabs.Panel value="sessions" pt="md">
                    {data.events.length > 0 ? (
                      <Stack gap="md">
                        <EventDayStrip
                          days={days}
                          selected={activeDay}
                          onSelect={setSelectedDay}
                        />
                        {dayEvents.length > 0 ? (
                          <SimpleGrid
                            cols={{ base: 1, sm: 2, lg: 3 }}
                            spacing="md"
                          >
                            {dayEvents.map((event) => (
                              <EventCard
                                key={event.id}
                                exhibitionId={data.id}
                                event={event}
                                runtimeMinutes={data.runtimeMinutes}
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
                      <Text c="dimmed">
                        {t('exhibitions.detail.emptyEvents')}
                      </Text>
                    )}
                  </Tabs.Panel>

                  <Tabs.Panel value="cast" pt="md">
                    {activeTab === 'cast' && <CastTab tmdbId={data.tmdbId} />}
                  </Tabs.Panel>
                </Tabs>
              </Stack>
            </Paper>
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
