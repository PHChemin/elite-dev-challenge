import { Alert, Button, Stack } from '@mantine/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { getSharedTicket } from '@/api/tickets';
import { useApiResource } from '@/api/useApiResource';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { ROUTES } from '@/routes/routes';
import { TicketView } from '../_TicketView';

export function TicketSharePage() {
  const { t } = useTranslation();
  const { shareToken } = useParams<{ shareToken: string }>();
  const load = useCallback(
    () => getSharedTicket(shareToken ?? ''),
    [shareToken],
  );
  const { data, loading, error } = useApiResource(load);

  return (
    <Stack gap="lg">
      <PageBreadcrumbs
        items={[
          { label: t('nav.home'), to: ROUTES.exhibitions },
          { label: t('tickets.share.title') },
        ]}
      />
      <AsyncSection loading={loading} error={error}>
        {data && <TicketView ticket={data} />}
        {!loading && error && (
          <Stack gap="md">
            <Alert color="brand.4" title={t('errors.title')}>
              {error}
            </Alert>
            <Button component={Link} to={ROUTES.exhibitions} variant="outline">
              {t('tickets.share.back')}
            </Button>
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
