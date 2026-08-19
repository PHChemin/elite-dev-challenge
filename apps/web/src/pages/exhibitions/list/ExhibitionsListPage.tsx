import { Group, Pagination, Paper, Stack, Text, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import { getUpcomingMovies } from '@/api/catalog';
import { listPublishedExhibitions } from '@/api/exhibitions';
import { useApiResource } from '@/api/useApiResource';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { PageTitle } from '@/components/UI/PageTitle';
import { ExhibitionCarousel } from './_ExhibitionCarousel';
import { ExhibitionSearch } from './_ExhibitionSearch';
import { UpcomingCarousel } from './_UpcomingCarousel';

const DEFAULT_PAGE = 1;
const PAGE_SIZE = 12;

export function ExhibitionsListPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const qFromUrl = searchParams.get('q') ?? '';
  const pageFromUrl = Number(searchParams.get('page') ?? DEFAULT_PAGE);
  const page =
    Number.isFinite(pageFromUrl) && pageFromUrl > 0
      ? pageFromUrl
      : DEFAULT_PAGE;

  const [searchDraft, setSearchDraft] = useState(qFromUrl);
  const [debouncedSearch] = useDebouncedValue(searchDraft, 300);

  useEffect(() => {
    setSearchDraft(qFromUrl);
  }, [qFromUrl]);

  useEffect(() => {
    const nextQ = debouncedSearch.trim();
    const currentQ = searchParams.get('q') ?? '';
    if (nextQ === currentQ) {
      return;
    }
    const next = new URLSearchParams(searchParams);
    if (nextQ) {
      next.set('q', nextQ);
    } else {
      next.delete('q');
    }
    next.set('page', String(DEFAULT_PAGE));
    setSearchParams(next, { replace: true });
  }, [debouncedSearch, searchParams, setSearchParams]);

  const loadExhibitions = useCallback(
    () =>
      listPublishedExhibitions({
        q: qFromUrl || undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
    [page, qFromUrl],
  );
  const loadUpcoming = useCallback(() => getUpcomingMovies(1), []);

  const exhibitions = useApiResource(loadExhibitions);
  const upcoming = useApiResource(loadUpcoming);

  function handlePageChange(nextPage: number) {
    const next = new URLSearchParams(searchParams);
    next.set('page', String(nextPage));
    setSearchParams(next);
  }

  return (
    <Stack gap="xl">
      <PageBreadcrumbs items={[{ label: t('nav.home') }]} />
      <PageTitle>{t('exhibitions.list.title')}</PageTitle>
      <ExhibitionSearch value={searchDraft} onChange={setSearchDraft} />

      <Stack gap="md">
        <Title order={2} fz="h3" ta="left">
          {t('exhibitions.list.nowShowing')}
        </Title>
        <AsyncSection
          loading={exhibitions.loading}
          error={exhibitions.error}
          onRetry={exhibitions.reload}
        >
          {exhibitions.data && exhibitions.data.items.length > 0 ? (
            <Stack gap="lg">
              <ExhibitionCarousel exhibitions={exhibitions.data.items} />
              {exhibitions.data.totalPages > 1 && (
                <Group justify="center">
                  <Pagination
                    total={exhibitions.data.totalPages}
                    value={exhibitions.data.page}
                    onChange={handlePageChange}
                  />
                </Group>
              )}
            </Stack>
          ) : (
            <Paper p="xl">
              <Text ta="center">{t('exhibitions.list.empty')}</Text>
            </Paper>
          )}
        </AsyncSection>
      </Stack>

      <Stack gap="md">
        <Title order={2} fz="h3" ta="left">
          {t('exhibitions.list.comingSoon')}
        </Title>
        <AsyncSection
          loading={upcoming.loading}
          error={upcoming.error}
          onRetry={upcoming.reload}
        >
          {upcoming.data && upcoming.data.results.length > 0 ? (
            <UpcomingCarousel movies={upcoming.data.results} />
          ) : (
            <Paper p="lg">
              <Text ta="center" c="dimmed">
                {t('exhibitions.list.upcomingEmpty')}
              </Text>
            </Paper>
          )}
        </AsyncSection>
      </Stack>
    </Stack>
  );
}
