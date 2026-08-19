import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { mdiSeat } from '@mdi/js';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { getPublishedEvent } from '@/api/events';
import { useApiResource } from '@/api/useApiResource';
import { useAuth } from '@/auth/useAuth';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppIcon } from '@/components/UI/AppIcon';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import {
  ROUTES,
  toEventSeats,
  toExhibitionDetail,
} from '@/routes/routes';
import { formatCents, formatDateTime } from '@/utils/format';
import { canBuyEvent, eventSaleState } from '@/utils/event-sale';
import { QtyStepper } from '@/components/UI/QtyStepper';

const POSTER_WIDTH = 180;
const POSTER_HEIGHT = 270;

type QtyForm = {
  fullCount: number;
  halfCount: number;
};

export function EventDetailPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { exhibitionId, eventId } = useParams<{
    exhibitionId: string;
    eventId: string;
  }>();
  const load = useCallback(
    () => getPublishedEvent(eventId ?? ''),
    [eventId],
  );
  const { data, loading, error, reload } = useApiResource(load);
  const form = useForm<QtyForm>({
    initialValues: { fullCount: 0, halfCount: 0 },
  });

  const fullCount = form.values.fullCount;
  const halfCount = form.values.halfCount;
  const quantity = fullCount + halfCount;
  const sale = data ? eventSaleState(data.startsAt) : 'open';
  const started = sale === 'started';
  const soldOut = (data?.freeSeatCount ?? 0) === 0;
  const overCap =
    data != null && quantity > data.maxTicketsPerOrder;
  const overFree = data != null && quantity > data.freeSeatCount;
  const qtyValid = quantity >= 1 && !overCap && !overFree;
  const qtyError = overCap
    ? t('events.buy.overCap')
    : overFree && data
      ? t('events.buy.notEnoughSeats', { count: data.freeSeatCount })
      : undefined;
  const total =
    data != null
      ? fullCount * data.priceFull + halfCount * data.priceHalf
      : 0;

  function handleContinue() {
    if (!data || !exhibitionId || !eventId) {
      return;
    }
    if (!canBuyEvent(data.startsAt)) {
      return;
    }
    if (quantity < 1) {
      form.setErrors({ fullCount: t('events.buy.qtyRequired') });
      return;
    }
    if (quantity > data.maxTicketsPerOrder) {
      form.setErrors({ fullCount: t('events.buy.overCap') });
      return;
    }
    if (quantity > data.freeSeatCount) {
      form.setErrors({
        fullCount: t('events.buy.notEnoughSeats', {
          count: data.freeSeatCount,
        }),
      });
      return;
    }
    const seatsPath = toEventSeats(
      exhibitionId,
      eventId,
      fullCount,
      halfCount,
    );
    if (!user) {
      void navigate(ROUTES.login, {
        state: { from: { pathname: seatsPath.split('?')[0], search: `?${seatsPath.split('?')[1]}` } },
      });
      return;
    }
    if (user.role !== 'customer') {
      notifications.show({
        title: t('errors.title'),
        message: t('events.buy.customerOnly'),
        color: 'brand.4',
      });
      return;
    }
    void navigate(seatsPath);
  }

  return (
    <Stack gap="lg">
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && exhibitionId === data.exhibition.id && (
          <Stack gap="lg">
            <PageBreadcrumbs
              items={[
                { label: t('nav.home'), to: ROUTES.exhibitions },
                {
                  label: data.exhibition.title,
                  to: toExhibitionDetail(data.exhibition.id),
                },
                { label: formatDateTime(data.startsAt) },
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
                      {data.exhibition.title}
                    </Title>
                    {sale === 'starts_soon' && (
                      <Text size="sm" c="brand.4" fw={700}>
                        {t('events.sale.startsSoon')}
                      </Text>
                    )}
                    {started && (
                      <Text size="sm" c="dimmed" fw={700}>
                        {t('events.sale.started')}
                      </Text>
                    )}
                    <Text>{formatDateTime(data.startsAt)}</Text>
                    <Text>{data.venueName}</Text>
                    {data.venueAddress && (
                      <Text size="sm" c="dimmed">
                        {data.venueAddress}
                      </Text>
                    )}
                    <Text>
                      {t('events.priceLine', {
                        full: formatCents(data.priceFull),
                        half: formatCents(data.priceHalf),
                      })}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {t('exhibitions.detail.cap', {
                        max: data.maxTicketsPerOrder,
                      })}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {t('events.buy.freeSeats', {
                        count: data.freeSeatCount,
                      })}
                    </Text>
                  </Stack>
                </Group>
                {started ? (
                  <Alert color="brand.4">{t('events.buy.eventStarted')}</Alert>
                ) : soldOut ? (
                  <Alert color="brand.4">{t('events.buy.soldOut')}</Alert>
                ) : (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleContinue();
                    }}
                  >
                    <Stack gap="md">
                      <Group grow align="flex-start">
                        <QtyStepper
                          label={t('events.buy.full')}
                          value={fullCount}
                          min={0}
                          max={data.maxTicketsPerOrder}
                          error={form.errors.fullCount ?? qtyError}
                          onChange={(value) =>
                            form.setFieldValue('fullCount', value)
                          }
                        />
                        <QtyStepper
                          label={t('events.buy.half')}
                          value={halfCount}
                          min={0}
                          max={data.maxTicketsPerOrder}
                          onChange={(value) =>
                            form.setFieldValue('halfCount', value)
                          }
                        />
                      </Group>
                      <Text fw={700}>
                        {t('events.buy.total', { total: formatCents(total) })}
                      </Text>
                      <Button
                        type="submit"
                        leftSection={<AppIcon path={mdiSeat} />}
                        disabled={!qtyValid}
                      >
                        {t('events.buy.chooseSeats')}
                      </Button>
                    </Stack>
                  </form>
                )}
              </Stack>
            </Paper>
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
