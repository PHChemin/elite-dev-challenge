import {
  Alert,
  Button,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { mdiCheck } from '@mdi/js';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { getEventSeats, getPublishedEvent } from '@/api/events';
import { createHold } from '@/api/reservations';
import { useApiResource } from '@/api/useApiResource';
import { AppIcon } from '@/components/UI/AppIcon';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import {
  ROUTES,
  toEventDetail,
  toExhibitionDetail,
  toPendingHold,
} from '@/routes/routes';
import { formatCents, formatDateTime } from '@/utils/format';
import { canBuyEvent } from '@/utils/event-sale';
import { SeatLegend } from './_SeatLegend';
import { SeatMap } from './_SeatMap';

function parseCount(value: string | null): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : NaN;
}

export function SeatMapPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { exhibitionId, eventId } = useParams<{
    exhibitionId: string;
    eventId: string;
  }>();
  const [searchParams] = useSearchParams();
  const fullCount = parseCount(searchParams.get('full'));
  const halfCount = parseCount(searchParams.get('half'));
  const needed = fullCount + halfCount;
  const load = useCallback(async () => {
    const [event, seats] = await Promise.all([
      getPublishedEvent(eventId ?? ''),
      getEventSeats(eventId ?? ''),
    ]);
    return { event, seats };
  }, [eventId]);
  const { data, loading, error, reload } = useApiResource(load);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const qtyInvalid =
    !Number.isInteger(fullCount) ||
    !Number.isInteger(halfCount) ||
    needed < 1 ||
    (data != null &&
      (needed > data.event.maxTicketsPerOrder ||
        needed > data.event.freeSeatCount ||
        !canBuyEvent(data.event.startsAt)));

  const backTo = toEventDetail(exhibitionId ?? '', eventId ?? '');

  function toggleSeat(label: string) {
    setSelected((current) => {
      if (current.includes(label)) {
        return current.filter((item) => item !== label);
      }
      if (current.length >= needed) {
        return current;
      }
      return [...current, label];
    });
  }

  const total = useMemo(() => {
    if (!data) {
      return 0;
    }
    return fullCount * data.event.priceFull + halfCount * data.event.priceHalf;
  }, [data, fullCount, halfCount]);

  async function handleConfirm() {
    if (!data || selected.length !== needed || !eventId) {
      return;
    }
    setSubmitting(true);
    try {
      const hold = await createHold({
        eventId,
        seatLabels: selected,
        fullCount,
        halfCount,
      });
      void navigate(toPendingHold(hold.id));
    } catch (cause) {
      if (cause instanceof ApiError && cause.statusCode === 409) {
        notifications.show({
          title: t('events.seats.conflictTitle'),
          message: cause.message,
          color: 'brand.4',
        });
        setSelected([]);
        reload();
      } else {
        notifications.show({
          title: t('errors.title'),
          message:
            cause instanceof ApiError
              ? cause.message
              : t('errors.api.requestFailed'),
          color: 'brand.4',
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && !error && qtyInvalid && exhibitionId && eventId) {
    return <Navigate to={backTo} replace />;
  }

  return (
    <Stack gap="lg">
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && (
          <Stack gap="lg">
            <PageBreadcrumbs
              items={[
                { label: t('nav.home'), to: ROUTES.exhibitions },
                {
                  label: data.event.exhibition.title,
                  to: toExhibitionDetail(data.event.exhibition.id),
                },
                {
                  label: formatDateTime(data.event.startsAt),
                  to: backTo,
                },
                { label: t('events.seats.title') },
              ]}
            />
            {data.seats.myHold && (
              <Alert color="brand.6">
                <Group justify="space-between" wrap="wrap">
                  <Text>{t('events.seats.existingHold')}</Text>
                  <Button
                    component={Link}
                    to={toPendingHold(data.seats.myHold.id)}
                    size="compact-sm"
                    variant="outline"
                  >
                    {t('events.seats.continueHold')}
                  </Button>
                </Group>
              </Alert>
            )}
            <Group align="flex-start" gap="xl" wrap="wrap">
              <Paper p="md" className="seat-map-panel" flex={1} miw={280}>
                <Stack gap="md">
                  <SeatMap
                    seats={data.seats.seats}
                    selected={selected}
                    onToggle={toggleSeat}
                  />
                  <SeatLegend />
                </Stack>
              </Paper>
              <Paper
                p="md"
                miw={240}
                maw={320}
                flex="0 1 320px"
                className="seat-map-summary"
              >
                <Stack gap="sm">
                  <Title order={2} fz="h4" ta="left">
                    {t('events.seats.summary')}
                  </Title>
                  <Text>
                    {t('events.seats.counts', {
                      full: fullCount,
                      half: halfCount,
                    })}
                  </Text>
                  <Text>
                    {t('events.seats.picked', {
                      current: selected.length,
                      needed,
                    })}
                  </Text>
                  <Text size="sm">
                    {selected.length > 0
                      ? selected.join(', ')
                      : t('events.seats.none')}
                  </Text>
                  <Text fw={700}>
                    {t('events.buy.total', { total: formatCents(total) })}
                  </Text>
                  <Button
                    leftSection={<AppIcon path={mdiCheck} />}
                    disabled={selected.length !== needed}
                    loading={submitting}
                    onClick={() => void handleConfirm()}
                  >
                    {t('events.seats.confirm')}
                  </Button>
                </Stack>
              </Paper>
            </Group>
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
