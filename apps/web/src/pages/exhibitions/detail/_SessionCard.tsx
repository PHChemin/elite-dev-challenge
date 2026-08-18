import { Paper, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { PublicEvent } from '@/api/types';
import { formatCents, formatTime } from '@/utils/format';

export function SessionCard({ event }: { event: PublicEvent }) {
  const { t } = useTranslation();

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Title order={3} fz="h4" ta="left">
          {formatTime(event.startsAt)}
        </Title>
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
      </Stack>
    </Paper>
  );
}
