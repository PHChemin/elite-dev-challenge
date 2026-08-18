import { Button, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { mdiPlus, mdiPublish, mdiSwapHorizontal } from '@mdi/js';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { updateEvent } from '@/api/events';
import { getMyExhibition, updateExhibition } from '@/api/exhibitions';
import type {
  CatalogMovie,
  OrganizerEvent,
  PublishStatus,
} from '@/api/types';
import { useApiResource } from '@/api/useApiResource';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppBadge } from '@/components/UI/AppBadge';
import { AppIcon } from '@/components/UI/AppIcon';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import {
  ROUTES,
  toOrganizerEventsNew,
} from '@/routes/routes';
import { formatDateTime } from '@/utils/format';
import { MoviePicker } from '../_MoviePicker';
import { PublishToggle } from '../_PublishToggle';
import { EventsTable } from './_EventsTable';

const POSTER_WIDTH = 120;
const POSTER_HEIGHT = 180;

export function OrganizerExhibitionPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const load = useCallback(() => getMyExhibition(id ?? ''), [id]);
  const { data, loading, error, reload } = useApiResource(load);
  const [changingKey, setChangingKey] = useState<string | null>(null);
  const [movieError, setMovieError] = useState<string | undefined>(undefined);
  const [pickingMovie, setPickingMovie] = useState(false);

  async function changeExhibitionStatus(publishStatus: PublishStatus) {
    if (!data) {
      return;
    }
    setChangingKey('exhibition');
    try {
      await updateExhibition(data.id, { publishStatus });
      notifications.show({
        title:
          publishStatus === 'published'
            ? t('exhibitions.organizer.published')
            : t('exhibitions.organizer.unpublished'),
        message: data.title,
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
      setChangingKey(null);
    }
  }

  async function changeEventStatus(
    event: OrganizerEvent,
    publishStatus: PublishStatus,
  ) {
    setChangingKey(event.id);
    try {
      await updateEvent(event.id, { publishStatus });
      notifications.show({
        title:
          publishStatus === 'published'
            ? t('events.organizer.published')
            : t('events.organizer.unpublished'),
        message: formatDateTime(event.startsAt),
        color: publishStatus === 'published' ? 'success.5' : 'brand.6',
      });
      reload();
    } catch (cause) {
      notifications.show({
        title: t('events.organizer.changeFailed'),
        message:
          cause instanceof ApiError
            ? cause.message
            : t('errors.api.requestFailed'),
        color: 'brand.4',
      });
    } finally {
      setChangingKey(null);
    }
  }

  async function publishAllEvents() {
    if (!data) {
      return;
    }
    const drafts = data.events.filter(
      (event) => event.publishStatus === 'draft',
    );
    if (drafts.length === 0) {
      return;
    }
    setChangingKey('events');
    try {
      await Promise.all(
        drafts.map((event) =>
          updateEvent(event.id, { publishStatus: 'published' }),
        ),
      );
      notifications.show({
        title: t('exhibitions.organizer.publishedAll'),
        message: data.title,
        color: 'success.5',
      });
      reload();
    } catch (cause) {
      notifications.show({
        title: t('events.organizer.changeFailed'),
        message:
          cause instanceof ApiError
            ? cause.message
            : t('errors.api.requestFailed'),
        color: 'brand.4',
      });
    } finally {
      setChangingKey(null);
    }
  }

  async function saveMovie(movie: CatalogMovie) {
    if (!data) {
      return;
    }
    try {
      await updateExhibition(data.id, { tmdbId: movie.tmdbId });
      notifications.show({
        title: t('exhibitions.form.movieSaved'),
        message: movie.title,
        color: 'success.5',
      });
      setMovieError(undefined);
      setPickingMovie(false);
      reload();
    } catch (cause) {
      if (cause instanceof ApiError) {
        setMovieError(cause.fieldErrors.tmdbId?.[0]);
        notifications.show({
          title: t('exhibitions.form.failed'),
          message: cause.message,
          color: 'brand.4',
        });
      } else {
        notifications.show({
          title: t('exhibitions.form.failed'),
          message: t('errors.api.requestFailed'),
          color: 'brand.4',
        });
      }
    }
  }

  return (
    <Stack gap="lg">
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && (
          <Stack gap="lg">
            <PageBreadcrumbs
              items={[
                { label: t('nav.home'), to: ROUTES.exhibitions },
                {
                  label: t('exhibitions.organizer.title'),
                  to: ROUTES.organizerExhibitions,
                },
                { label: data.title },
              ]}
            />
            <Paper p={{ base: 'md', sm: 'xl' }}>
              <Group align="flex-start" gap="xl" wrap="wrap">
                <MoviePoster
                  src={data.posterUrl}
                  alt={data.title}
                  width={POSTER_WIDTH}
                  height={POSTER_HEIGHT}
                />
                <Stack gap="md" flex={1} miw={240}>
                  <Group
                    justify="space-between"
                    align="flex-start"
                    wrap="wrap"
                    gap="md"
                  >
                    <Stack gap="xs">
                      <Title order={1} fz={{ base: 'h3', sm: 'h2' }} ta="left">
                        {data.title}
                      </Title>
                      <AppBadge
                        color={
                          data.publishStatus === 'published'
                            ? 'success'
                            : 'dark'
                        }
                        w="fit-content"
                      >
                        {t(`exhibitions.status.${data.publishStatus}`)}
                      </AppBadge>
                    </Stack>
                    <Group gap="sm" wrap="wrap">
                      {data.events.length === 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          leftSection={<AppIcon path={mdiSwapHorizontal} />}
                          onClick={() => setPickingMovie(true)}
                        >
                          {t('catalog.changeMovie')}
                        </Button>
                      )}
                      {data.events.length > 0 && (
                        <Button
                          component={Link}
                          to={toOrganizerEventsNew(data.id)}
                          variant="outline"
                          size="sm"
                          leftSection={<AppIcon path={mdiPlus} />}
                        >
                          {t('events.organizer.new')}
                        </Button>
                      )}
                      <PublishToggle
                        publishStatus={data.publishStatus}
                        loading={changingKey === 'exhibition'}
                        size="sm"
                        variant={
                          data.publishStatus === 'draft' ? 'filled' : 'outline'
                        }
                        onToggle={() =>
                          void changeExhibitionStatus(
                            data.publishStatus === 'published'
                              ? 'draft'
                              : 'published',
                          )
                        }
                      />
                    </Group>
                  </Group>

                  {data.events.length === 0 && (
                    <Stack gap="sm">
                      <Text size="sm" c="dimmed">
                        {t('exhibitions.form.movieCanChange')}
                      </Text>
                      {pickingMovie && (
                        <MoviePicker
                          selected={null}
                          error={movieError}
                          onSelect={(selected) => {
                            if (selected && selected.tmdbId !== data.tmdbId) {
                              void saveMovie(selected);
                            } else {
                              setPickingMovie(false);
                            }
                          }}
                        />
                      )}
                    </Stack>
                  )}
                </Stack>
              </Group>
            </Paper>

            <Group justify="space-between" align="center" wrap="wrap">
              <Title order={2} fz="h4" ta="left">
                {t('events.organizer.title')}
              </Title>
              {data.events.some((event) => event.publishStatus === 'draft') && (
                <Button
                  variant="outline"
                  leftSection={<AppIcon path={mdiPublish} />}
                  loading={changingKey === 'events'}
                  onClick={() => void publishAllEvents()}
                >
                  {t('exhibitions.organizer.publishAll')}
                </Button>
              )}
            </Group>

            {data.events.length > 0 ? (
              <EventsTable
                exhibitionId={data.id}
                events={data.events}
                changingKey={changingKey}
                onChangeStatus={(event, publishStatus) =>
                  void changeEventStatus(event, publishStatus)
                }
              />
            ) : (
              <Paper p="xl">
                <Stack align="center" gap="md">
                  <Text ta="center">{t('events.organizer.empty')}</Text>
                  <Button
                    component={Link}
                    to={toOrganizerEventsNew(data.id)}
                    leftSection={<AppIcon path={mdiPlus} />}
                  >
                    {t('events.organizer.new')}
                  </Button>
                </Stack>
              </Paper>
            )}
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
