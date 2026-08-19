import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { HoldResponse } from '@/api/types';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppBadge } from '@/components/UI/AppBadge';
import { toPendingHold } from '@/routes/routes';
import { formatCents, formatCountdown, formatDateTime } from '@/utils/format';

const POSTER_WIDTH = 140;
const POSTER_HEIGHT = 210;

export function PendingHoldCard({ hold }: { hold: HoldResponse }) {
  const { t } = useTranslation();
  const [clock, setClock] = useState(() => formatCountdown(hold.expiresAt));
  const totalCents =
    hold.fullCount * hold.event.priceFull +
    hold.halfCount * hold.event.priceHalf;

  useEffect(() => {
    const tick = () => setClock(formatCountdown(hold.expiresAt));
    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [hold.expiresAt]);

  return (
    <Paper p="md">
      <Stack gap="md">
        <Group align="flex-start" gap="xl" wrap="wrap">
          <MoviePoster
            src={hold.exhibition.posterUrl}
            alt={hold.exhibition.title}
            width={POSTER_WIDTH}
            height={POSTER_HEIGHT}
          />
          <Stack gap="sm" flex={1} miw={240}>
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Title order={3} fz="h4" ta="left">
                {hold.exhibition.title}
              </Title>
              <AppBadge color="brand.4">{t('tickets.pending.badge')}</AppBadge>
            </Group>
            <Text>{formatDateTime(hold.event.startsAt)}</Text>
            <Text>{hold.event.venueName}</Text>
            <Text>
              {t('reservations.pending.seats', {
                seats: hold.seatLabels.join(', '),
              })}
            </Text>
            <Text>
              {t('events.seats.counts', {
                full: hold.fullCount,
                half: hold.halfCount,
              })}
            </Text>
            <Text fw={700}>
              {t('events.buy.total', { total: formatCents(totalCents) })}
            </Text>
            <Text fw={700}>{t('tickets.pending.timer', { time: clock })}</Text>
            <Button component={Link} to={toPendingHold(hold.id)}>
              {t('tickets.pending.finishCheckout')}
            </Button>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
}
