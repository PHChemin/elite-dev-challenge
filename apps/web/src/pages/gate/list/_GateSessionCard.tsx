import { Paper, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { GateEventItem } from '@/api/types';
import { AppBadge } from '@/components/UI/AppBadge';
import { formatDateTime } from '@/utils/format';

type GateSessionCardProps = {
  event: GateEventItem;
  onSelect: () => void;
};

export function GateSessionCard({ event, onSelect }: GateSessionCardProps) {
  const { t } = useTranslation();

  return (
    <Paper
      component="button"
      type="button"
      p="md"
      withBorder
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
        background: 'var(--mantine-color-white)',
      }}
    >
      <Stack gap="sm">
        <Stack gap={4}>
          {event.saleState === 'starts_soon' && (
            <AppBadge color="brand.4" variant="light" w="fit-content">
              {t('events.sale.startsSoon')}
            </AppBadge>
          )}
          {event.saleState === 'in_progress' && (
            <AppBadge color="success" variant="light" w="fit-content">
              {t('events.sale.inProgress')}
            </AppBadge>
          )}
          <Title order={3} fz="h4">
            {event.exhibition.title}
          </Title>
          <Text fw={500}>{formatDateTime(event.startsAt)}</Text>
          <Text size="sm">{event.venueName}</Text>
          {event.venueAddress && (
            <Text size="sm" c="dimmed">
              {event.venueAddress}
            </Text>
          )}
        </Stack>
        <Text size="sm" c="brand">
          {t('gate.sessions.open')}
        </Text>
      </Stack>
    </Paper>
  );
}
