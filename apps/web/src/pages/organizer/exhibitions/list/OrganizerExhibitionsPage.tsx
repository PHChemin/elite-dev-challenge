import { Button, Group, Paper, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { mdiPlus } from '@mdi/js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { listMyExhibitions, updateExhibition } from '@/api/exhibitions';
import type { OrganizerExhibitionSummary, PublishStatus } from '@/api/types';
import { useApiResource } from '@/api/useApiResource';
import { AppIcon } from '@/components/UI/AppIcon';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { PageTitle } from '@/components/UI/PageTitle';
import { ROUTES } from '@/routes/routes';
import { ExhibitionsTable } from './_ExhibitionsTable';

export function OrganizerExhibitionsPage() {
  const { t } = useTranslation();
  const { data, loading, error, reload } = useApiResource(listMyExhibitions);
  const [changingId, setChangingId] = useState<string | null>(null);

  async function changePublishStatus(
    exhibition: OrganizerExhibitionSummary,
    publishStatus: PublishStatus,
  ) {
    setChangingId(exhibition.id);
    try {
      await updateExhibition(exhibition.id, { publishStatus });
      notifications.show({
        title:
          publishStatus === 'published'
            ? t('exhibitions.organizer.published')
            : t('exhibitions.organizer.unpublished'),
        message: exhibition.title,
        color: publishStatus === 'published' ? 'success.5' : 'brand.6',
      });
      reload();
    } catch (cause) {
      notifications.show({
        title: t('exhibitions.organizer.changeFailed'),
        message:
          cause instanceof ApiError
            ? cause.message
            : t('errors.api.requestFailed'),
        color: 'brand.4',
      });
    } finally {
      setChangingId(null);
    }
  }

  return (
    <Stack gap="lg">
      <PageBreadcrumbs
        items={[
          { label: t('nav.home'), to: ROUTES.exhibitions },
          { label: t('exhibitions.organizer.title') },
        ]}
      />
      <Group justify="space-between" align="center" wrap="wrap" gap="md">
        <PageTitle ta="left">{t('exhibitions.organizer.title')}</PageTitle>
        <Button
          component={Link}
          to={ROUTES.organizerExhibitionNew}
          leftSection={<AppIcon path={mdiPlus} />}
        >
          {t('exhibitions.organizer.new')}
        </Button>
      </Group>

      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && data.length > 0 ? (
          <ExhibitionsTable
            exhibitions={data}
            changingId={changingId}
            onChangeStatus={(exhibition, publishStatus) =>
              void changePublishStatus(exhibition, publishStatus)
            }
          />
        ) : (
          <Paper p="xl">
            <Stack align="center" gap="md">
              <Text ta="center">{t('exhibitions.organizer.empty')}</Text>
              <Button
                component={Link}
                to={ROUTES.organizerExhibitionNew}
                leftSection={<AppIcon path={mdiPlus} />}
              >
                {t('exhibitions.organizer.new')}
              </Button>
            </Stack>
          </Paper>
        )}
      </AsyncSection>
    </Stack>
  );
}
