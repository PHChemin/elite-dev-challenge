import { Pagination, SimpleGrid, Stack, Text } from '@mantine/core';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { listGateEvents } from '@/api/gate';
import { useApiResource } from '@/api/useApiResource';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageTitle } from '@/components/UI/PageTitle';
import { toGateScan } from '@/routes/routes';
import { GateSessionCard } from './_GateSessionCard';

const PAGE_SIZE = 12;

export function GateSessionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);

  const loadEvents = useCallback(
    () => listGateEvents({ page, pageSize: PAGE_SIZE }),
    [page],
  );
  const { data, loading, error, reload } = useApiResource(loadEvents);

  return (
    <Stack gap="xl">
      <PageTitle ta="left">{t('gate.sessions.title')}</PageTitle>
      <Text c="dimmed">{t('gate.sessions.subtitle')}</Text>
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && (
          <Stack gap="lg">
            {data.items.length === 0 ? (
              <Text c="dimmed">{t('gate.sessions.empty')}</Text>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
                {data.items.map((event) => (
                  <GateSessionCard
                    key={event.id}
                    event={event}
                    onSelect={() => void navigate(toGateScan(event.id))}
                  />
                ))}
              </SimpleGrid>
            )}
            {data.totalPages > 1 && (
              <Pagination
                value={page}
                onChange={setPage}
                total={data.totalPages}
              />
            )}
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
