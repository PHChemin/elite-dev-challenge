import { Paper, SimpleGrid, Stack, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import { listPublishedExhibitions } from '@/api/exhibitions';
import { useApiResource } from '@/api/useApiResource';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { PageTitle } from '@/components/UI/PageTitle';
import { ExhibitionCard } from './_ExhibitionCard';

export function ExhibitionsListPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useApiResource(
    listPublishedExhibitions,
  );

  return (
    <Stack gap="lg">
      <PageBreadcrumbs items={[{ label: t('nav.home') }]} />
      <PageTitle>{t('exhibitions.list.title')}</PageTitle>
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && data.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="lg">
            {data.map((exhibition) => (
              <ExhibitionCard key={exhibition.id} exhibition={exhibition} />
            ))}
          </SimpleGrid>
        ) : (
          <Paper p="xl">
            <Text ta="center">{t('exhibitions.list.empty')}</Text>
          </Paper>
        )}
      </AsyncSection>
    </Stack>
  );
}
