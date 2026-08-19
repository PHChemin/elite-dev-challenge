import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { mdiSeat } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { PublicEvent } from '@/api/types';
import { AppBadge } from '@/components/UI/AppBadge';
import { AppIcon } from '@/components/UI/AppIcon';
import { toEventDetail } from '@/routes/routes';
import { formatCents, formatTime } from '@/utils/format';
import { canBuyEvent, eventSaleState } from '@/utils/event-sale';

export function EventCard({
  exhibitionId,
  event,
  runtimeMinutes,
}: {
  exhibitionId: string;
  event: PublicEvent;
  runtimeMinutes?: number | null;
}) {
  const { t } = useTranslation();
  const sale = eventSaleState(event.startsAt, runtimeMinutes);
  const started = !canBuyEvent(event.startsAt);
  const detailPath = toEventDetail(exhibitionId, event.id);

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Title order={3} fz="h4" ta="left">
            {formatTime(event.startsAt)}
          </Title>
          {sale === 'starts_soon' && (
            <AppBadge color="brand.4" variant="light">
              {t('events.sale.startsSoon')}
            </AppBadge>
          )}
          {sale === 'in_progress' && (
            <AppBadge color="success" variant="light">
              {t('events.sale.inProgress')}
            </AppBadge>
          )}
          {sale === 'ended' && (
            <AppBadge color="gray" variant="light">
              {t('events.sale.ended')}
            </AppBadge>
          )}
        </Group>
        <Stack gap={2}>
          <Text>{event.venueName}</Text>
          {event.venueAddress && (
            <Text size="sm" c="dimmed">
              {event.venueAddress}
            </Text>
          )}
        </Stack>
        <Text size="sm">
          {t('events.priceLine', {
            full: formatCents(event.priceFull),
            half: formatCents(event.priceHalf),
          })}
        </Text>
        <Text size="sm" c="dimmed">
          {t('exhibitions.detail.cap', { max: event.maxTicketsPerOrder })}
        </Text>
        {started ? (
          <Button leftSection={<AppIcon path={mdiSeat} />} disabled>
            {t('events.buy.chooseSeats')}
          </Button>
        ) : (
          <Button
            component={Link}
            to={detailPath}
            leftSection={<AppIcon path={mdiSeat} />}
          >
            {t('events.buy.chooseSeats')}
          </Button>
        )}
      </Stack>
    </Paper>
  );
}
