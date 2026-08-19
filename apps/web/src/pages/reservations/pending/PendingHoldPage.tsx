import { Alert, Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { mdiCheck, mdiClose } from '@mdi/js';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { payOrder } from '@/api/orders';
import { getHold } from '@/api/reservations';
import type { OrderResponse, PaymentStatus } from '@/api/types';
import { useApiResource } from '@/api/useApiResource';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppIcon } from '@/components/UI/AppIcon';
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
  const [order, setOrder] = useState<OrderResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const expired = clock === '00:00';

  useEffect(() => {
    if (!data || order) {
      return;
    }
    const tick = () => setClock(formatCountdown(data.expiresAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [data, order]);

  async function handlePay(result: PaymentStatus) {
    if (!holdId || expired || submitting) {
      return;
    }
    setSubmitting(true);
    try {
      const paid = await payOrder({ holdId, result });
      setOrder(paid);
    } catch (cause) {
      notifications.show({
        title: t('errors.title'),
        message:
          cause instanceof ApiError
            ? cause.message
            : t('errors.api.requestFailed'),
        color: 'brand.4',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && error && !order) {
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

  const approved = order?.paymentStatus === 'approved';
  const declined = order?.paymentStatus === 'declined';
  const titleKey = approved
    ? 'reservations.pending.approvedTitle'
    : declined
      ? 'reservations.pending.declinedTitle'
      : 'reservations.pending.title';

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
                { label: t(titleKey) },
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
                    <Title
                      order={1}
                      fz={{ base: 'h3', sm: 'h2' }}
                      ta="left"
                      c={approved ? 'success.5' : undefined}
                    >
                      {t(titleKey)}
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
                    {approved &&
                      order.tickets.map((ticket) => (
                        <Text key={ticket.id}>
                          {t('reservations.pending.ticket', {
                            seat: ticket.seatLabel,
                            kind: t(`events.buy.${ticket.kind}`),
                          })}
                        </Text>
                      ))}
                    <Text fw={700}>
                      {t('events.buy.total', {
                        total: formatCents(
                          order?.totalCents ??
                            (data.fullCount * data.event.priceFull +
                              data.halfCount * data.event.priceHalf),
                        ),
                      })}
                    </Text>
                    {declined && (
                      <Alert color="brand.4">
                        {t('reservations.pending.declinedBody')}
                      </Alert>
                    )}
                    {!order && (
                      <>
                        <Text
                          fw={700}
                          c={expired ? 'brand.4' : 'black'}
                        >
                          {t('reservations.pending.timer', { time: clock })}
                        </Text>
                        {expired && (
                          <Text c="dimmed">
                            {t('reservations.pending.expired')}
                          </Text>
                        )}
                        <Group gap="sm">
                          <Button
                            color="success"
                            leftSection={<AppIcon path={mdiCheck} />}
                            loading={submitting}
                            disabled={expired}
                            onClick={() => void handlePay('approved')}
                          >
                            {t('reservations.pending.approve')}
                          </Button>
                          <Button
                            variant="outline"
                            color="brand.4"
                            leftSection={<AppIcon path={mdiClose} />}
                            loading={submitting}
                            disabled={expired}
                            onClick={() => void handlePay('declined')}
                          >
                            {t('reservations.pending.decline')}
                          </Button>
                        </Group>
                      </>
                    )}
                    {approved && (
                      <Button
                        component={Link}
                        to={ROUTES.exhibitions}
                        variant="outline"
                      >
                        {t('reservations.pending.home')}
                      </Button>
                    )}
                    {declined && (
                      <Button
                        component={Link}
                        to={toExhibitionDetail(data.exhibition.id)}
                        variant="outline"
                      >
                        {t('reservations.pending.back')}
                      </Button>
                    )}
                    {!order && expired && (
                      <Button
                        component={Link}
                        to={toExhibitionDetail(data.exhibition.id)}
                        variant="outline"
                      >
                        {t('reservations.pending.back')}
                      </Button>
                    )}
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
