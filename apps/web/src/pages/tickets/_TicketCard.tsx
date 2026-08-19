import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { mdiTicketConfirmationOutline } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { MyTicket } from '@/api/types';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppBadge } from '@/components/UI/AppBadge';
import { AppIcon } from '@/components/UI/AppIcon';
import { toTicketDetail } from '@/routes/routes';
import { formatDateTime } from '@/utils/format';

const POSTER_WIDTH = 140;
const POSTER_HEIGHT = 210;

export function TicketCard({ ticket }: { ticket: MyTicket }) {
  const { t } = useTranslation();
  const used = ticket.usedAt != null;

  return (
    <Paper p="md">
      <Stack gap="md">
        <Group align="flex-start" gap="xl" wrap="wrap">
          <MoviePoster
            src={ticket.exhibition.posterUrl}
            alt={ticket.exhibition.title}
            width={POSTER_WIDTH}
            height={POSTER_HEIGHT}
          />
          <Stack gap="sm" flex={1} miw={240}>
            <Group justify="space-between" align="flex-start" wrap="wrap">
              <Title order={3} fz="h4" ta="left">
                {ticket.exhibition.title}
              </Title>
              <AppBadge color={used ? 'brand.4' : 'success'}>
                {used ? t('tickets.used') : t('tickets.valid')}
              </AppBadge>
            </Group>
            <Text>{formatDateTime(ticket.event.startsAt)}</Text>
            <Text>{ticket.event.venueName}</Text>
            <Text>
              {t('tickets.detail.seat', { seat: ticket.seatLabel })} ·{' '}
              {t(`events.buy.${ticket.kind}`)}
            </Text>
            <Button
              component={Link}
              to={toTicketDetail(ticket.id)}
              variant="outline"
              mt="auto"
              rightSection={<AppIcon path={mdiTicketConfirmationOutline} />}
            >
              {t('tickets.list.viewTicket')}
            </Button>
          </Stack>
        </Group>
      </Stack>
    </Paper>
  );
}
