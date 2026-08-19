import { Alert, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { getHold } from '@/api/reservations';
import { useApiResource } from '@/api/useApiResource';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { ROUTES, toExhibitionDetail } from '@/routes/routes';
import { formatCents, formatCountdown, formatDateTime } from '@/utils/format';

const POSTER_WIDTH = 140;
const POSTER_HEIGHT = 210;

export function PendingHoldPage() {
  const { t } = useTranslation();
  const { holdId } = useParams<{ holdId: string }>();
  const load = useCallback(() => getHold(holdId ?? ''), [holdId]);
  const { data, loading, error } = useApiResource(load);
  const [clock, setClock] = useState(() =>
    data ? formatCountdown(data.expiresAt) : '10:00',
  );

  useEffect(() => {
    if (!data) {
      return;
    }
    const tick = () => setClock(formatCountdown(data.expiresAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [data]);

  if (!loading && error) {
    return (
      <Stack gap="lg">
        <Alert color="brand.4" title={t('errors.title')}>
          {error}
        </Alert>
        <Text>{t('reservations.pending.expired')}</Text>
        <Button component={Link} to={ROUTES.exhibitions} variant="outline">
          {t('reservations.pending.back')}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <AsyncSection loading={loading} error={null}>
        {data && (
          <Stack gap="lg">
            <PageBreadcrumbs
              items={[
                { label: t('nav.home'), to: ROUTES.exhibitions },
                {
                  label: data.exhibition.title,
                  to: toExhibitionDetail(data.exhibition.id),
                },
                { label: t('reservations.pending.title') },
              ]}
            />
            <Paper p={{ base: 'md', sm: 'xl' }}>
              <Stack gap="lg">
                <Group align="flex-start" gap="xl" wrap="wrap">
                  <MoviePoster
                    src={data.exhibition.posterUrl}
                    alt={data.exhibition.title}
                    width={POSTER_WIDTH}
                    height={POSTER_HEIGHT}
                  />
                  <Stack gap="sm" flex={1} miw={240}>
                    <Title order={1} fz={{ base: 'h3', sm: 'h2' }} ta="left">
                      {t('reservations.pending.title')}
                    </Title>
                    <Text>{data.exhibition.title}</Text>
                    <Text>{formatDateTime(data.event.startsAt)}</Text>
                    <Text>{data.event.venueName}</Text>
                    <Text>
                      {t('events.seats.counts', {
                        full: data.fullCount,
                        half: data.halfCount,
                      })}
                    </Text>
                    <Text>
                      {t('reservations.pending.seats', {
                        seats: data.seatLabels.join(', '),
                      })}
                    </Text>
                    <Text fw={700}>
                      {t('events.buy.total', {
                        total: formatCents(
                          data.fullCount * data.event.priceFull +
                            data.halfCount * data.event.priceHalf,
                        ),
                      })}
                    </Text>
                    <Text fw={700} c={clock === '00:00' ? 'brand.4' : 'black'}>
                      {t('reservations.pending.timer', { time: clock })}
                    </Text>
                    {clock === '00:00' && (
                      <Text c="dimmed">
                        {t('reservations.pending.expired')}
                      </Text>
                    )}
                    <Button
                      component={Link}
                      to={toExhibitionDetail(data.exhibition.id)}
                      variant="outline"
                    >
                      {t('reservations.pending.back')}
                    </Button>
                  </Stack>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
