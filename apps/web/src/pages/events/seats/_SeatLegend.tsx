import { Group, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function SeatLegend() {
  const { t } = useTranslation();

  return (
    <Group gap="md" justify="center" wrap="wrap">
      <Group gap={6}>
        <span className="seat-btn seat-btn--legend" />
        <Text size="sm">{t('events.seats.free')}</Text>
      </Group>
      <Group gap={6}>
        <span className="seat-btn seat-btn--selected seat-btn--legend" />
        <Text size="sm">{t('events.seats.selected')}</Text>
      </Group>
      <Group gap={6}>
        <span className="seat-btn seat-btn--mine seat-btn--legend" />
        <Text size="sm">{t('events.seats.heldByMe')}</Text>
      </Group>
      <Group gap={6}>
        <span className="seat-btn seat-btn--taken seat-btn--legend" />
        <Text size="sm">{t('events.seats.taken')}</Text>
      </Group>
    </Group>
  );
}
