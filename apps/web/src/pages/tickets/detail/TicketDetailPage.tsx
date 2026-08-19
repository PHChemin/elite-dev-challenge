import { Alert, Button, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { mdiContentCopy } from '@mdi/js';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { listMyTickets } from '@/api/tickets';
import { useApiResource } from '@/api/useApiResource';
import { AppIcon } from '@/components/UI/AppIcon';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { ROUTES, ticketShareUrl } from '@/routes/routes';
import { TicketView } from '../_TicketView';

export function TicketDetailPage() {
  const { t } = useTranslation();
  const { ticketId } = useParams<{ ticketId: string }>();
  const load = useCallback(() => listMyTickets(), []);
  const { data, loading, error, reload } = useApiResource(load);
  const ticket = data?.find((row) => row.id === ticketId);

  async function handleCopyLink() {
    if (!ticket) {
      return;
    }
    try {
      await navigator.clipboard.writeText(ticketShareUrl(ticket.shareToken));
      notifications.show({
        title: t('tickets.copiedTitle'),
        message: t('tickets.copied'),
        color: 'success',
      });
    } catch {
      notifications.show({
        title: t('errors.title'),
        message: t('errors.api.requestFailed'),
        color: 'brand.4',
      });
    }
  }

  return (
    <Stack gap="lg">
      <PageBreadcrumbs
        items={[
          { label: t('nav.home'), to: ROUTES.exhibitions },
          { label: t('tickets.list.title'), to: ROUTES.tickets },
          { label: t('tickets.detail.title') },
        ]}
      />
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data &&
          (ticket ? (
            <Stack gap="md">
              <TicketView ticket={ticket} />
              <Button
                leftSection={<AppIcon path={mdiContentCopy} />}
                onClick={() => void handleCopyLink()}
              >
                {t('tickets.copyLink')}
              </Button>
            </Stack>
          ) : (
            <Stack gap="md">
              <Alert color="brand.4" title={t('errors.title')}>
                {t('tickets.detail.notFound')}
              </Alert>
              <Button component={Link} to={ROUTES.tickets} variant="outline">
                {t('tickets.detail.back')}
              </Button>
            </Stack>
          ))}
      </AsyncSection>
    </Stack>
  );
}
