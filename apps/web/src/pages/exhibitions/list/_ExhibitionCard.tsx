import { Button, Paper, Stack, Text, Title } from '@mantine/core';
import { mdiTicketConfirmationOutline } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { ExhibitionSummary } from '@/api/types';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppIcon } from '@/components/UI/AppIcon';
import { toExhibitionDetail } from '@/routes/routes';
import { formatDateTime } from '@/utils/format';
import { formatSessionCount } from '@/utils/text';

const POSTER_HEIGHT = 260;

export function ExhibitionCard({
  exhibition,
}: {
  exhibition: ExhibitionSummary;
}) {
  const { t } = useTranslation();

  return (
    <Paper p="md" h="100%">
      <Stack gap="sm" h="100%">
        <MoviePoster
          src={exhibition.posterUrl}
          alt={exhibition.title}
          height={POSTER_HEIGHT}
        />
        <Title order={3} fz="h4" ta="left" lineClamp={2}>
          {exhibition.title}
        </Title>
        <Stack gap={2}>
          <Text size="sm" fw={500}>
            {exhibition.nextStartsAt
              ? t('exhibitions.nextSession', {
                  when: formatDateTime(exhibition.nextStartsAt),
                })
              : t('exhibitions.noNextSession')}
          </Text>
          <Text size="sm" c="dimmed">
            {formatSessionCount(exhibition.eventCount, t)}
          </Text>
        </Stack>
        <Button
          component={Link}
          to={toExhibitionDetail(exhibition.id)}
          fullWidth
          mt="auto"
          rightSection={<AppIcon path={mdiTicketConfirmationOutline} />}
        >
          {t('exhibitions.buyTickets')}
        </Button>
      </Stack>
    </Paper>
  );
}
