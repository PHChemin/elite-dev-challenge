import { Group, Paper, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { SharedTicket } from '@/api/types';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppBadge } from '@/components/UI/AppBadge';
import { formatDate, formatTime } from '@/utils/format';
import { TicketQr } from './_TicketQr';

const POSTER_WIDTH = 140;
const POSTER_HEIGHT = 210;

type TicketViewProps = {
  ticket: SharedTicket;
  codeVisible?: boolean;
};

export function TicketView({ ticket, codeVisible = true }: TicketViewProps) {
  const { t } = useTranslation();
  const used = ticket.usedAt != null;

  return (
    <Paper p={{ base: 'md', sm: 'xl' }}>
      <Stack gap="lg">
        <Group align="flex-start" gap="xl" wrap="wrap">
          <MoviePoster
            src={ticket.exhibition.posterUrl}
            alt={ticket.exhibition.title}
            width={POSTER_WIDTH}
            height={POSTER_HEIGHT}
          />
          <Stack gap="sm" flex={1} miw={240}>
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Title order={1} fz={{ base: 'h3', sm: 'h2' }} ta="left">
                {ticket.exhibition.title}
              </Title>
              <AppBadge color={used ? 'brand.4' : 'success'}>
                {used ? t('tickets.used') : t('tickets.valid')}
              </AppBadge>
            </Group>
            <Text fw={500}>{formatDate(ticket.event.startsAt)}</Text>
            <Text>{formatTime(ticket.event.startsAt)}</Text>
            <Text>{ticket.event.venueName}</Text>
            {ticket.event.venueAddress && (
              <Text c="dimmed">{ticket.event.venueAddress}</Text>
            )}
            <Text>
              {t('tickets.detail.seat', { seat: ticket.seatLabel })}
            </Text>
            <Text>{t(`events.buy.${ticket.kind}`)}</Text>
          </Stack>
        </Group>
        <Stack align="center" gap="sm">
          <Text ta="center" c="dimmed">
            {t('tickets.detail.scanHint')}
          </Text>
          <TicketQr code={ticket.code} />
          {codeVisible && (
            <Text ff="monospace" size="sm" ta="center">
              {ticket.code}
            </Text>
          )}
        </Stack>
      </Stack>
    </Paper>
  );
}
