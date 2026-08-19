import { Paper, Stack, Text, Title } from '@mantine/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { listMyTickets } from '@/api/tickets';
import { listMyHolds } from '@/api/reservations';
import type { TicketsPageData } from '@/api/types';
import { useApiResource } from '@/api/useApiResource';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { PageTitle } from '@/components/UI/PageTitle';
import { ROUTES } from '@/routes/routes';
import { PendingHoldCard } from '../_PendingHoldCard';
import { TicketCard } from '../_TicketCard';

async function loadTicketsPage(): Promise<TicketsPageData> {
  const [holds, tickets] = await Promise.all([
    listMyHolds(),
    listMyTickets(),
  ]);
  return { holds, tickets };
}

export function TicketsListPage() {
  const { t } = useTranslation();
  const load = useCallback(() => loadTicketsPage(), []);
  const { data, loading, error, reload } = useApiResource(load);

  const empty =
    data != null && data.holds.length === 0 && data.tickets.length === 0;

  return (
    <Stack gap="lg">
      <PageBreadcrumbs
        items={[
          { label: t('nav.home'), to: ROUTES.exhibitions },
          { label: t('tickets.list.title') },
        ]}
      />
      <PageTitle ta="left">{t('tickets.list.title')}</PageTitle>
      <Text c="dimmed">{t('tickets.list.subtitle')}</Text>
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && (
          <Stack gap="xl">
            {data.holds.length > 0 && (
              <Stack gap="md">
                <Title order={3} fz="h4">
                  {t('tickets.pending.section')}
                </Title>
                {data.holds.map((hold) => (
                  <PendingHoldCard key={hold.id} hold={hold} />
                ))}
              </Stack>
            )}
            {data.tickets.length > 0 && (
              <Stack gap="md">
                {data.holds.length > 0 && (
                  <Title order={3} fz="h4">
                    {t('tickets.list.section')}
                  </Title>
                )}
                {data.tickets.map((ticket) => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </Stack>
            )}
            {empty && (
              <Paper p="xl">
                <Text ta="center">{t('tickets.list.empty')}</Text>
              </Paper>
            )}
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
