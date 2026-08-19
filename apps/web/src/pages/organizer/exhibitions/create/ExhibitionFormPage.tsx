import { Button, Group, Paper, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { mdiClose, mdiPlus } from '@mdi/js';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { createExhibition } from '@/api/exhibitions';
import type { CatalogMovie } from '@/api/types';
import { AppIcon } from '@/components/UI/AppIcon';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { PageTitle } from '@/components/UI/PageTitle';
import { ROUTES, toOrganizerEventsNew } from '@/routes/routes';
import { MoviePicker } from '../_MoviePicker';

export function ExhibitionFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [movie, setMovie] = useState<CatalogMovie | null>(null);
  const [movieError, setMovieError] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm({ initialValues: {} });

  async function submit() {
    if (!movie) {
      setMovieError(t('validation.tmdbId.required'));
      return;
    }
    setSubmitting(true);
    try {
      const created = await createExhibition({ tmdbId: movie.tmdbId });
      notifications.show({
        title: t('exhibitions.form.created'),
        message: movie.title,
        color: 'success.5',
      });
      void navigate(toOrganizerEventsNew(created.id));
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
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Stack gap="lg">
      <PageBreadcrumbs
        items={[
          { label: t('nav.home'), to: ROUTES.exhibitions },
          {
            label: t('exhibitions.organizer.title'),
            to: ROUTES.organizerExhibitions,
          },
          { label: t('exhibitions.form.newTitle') },
        ]}
      />
      <PageTitle>{t('exhibitions.form.newTitle')}</PageTitle>
      <Paper p={{ base: 'md', sm: 'xl' }}>
        <form onSubmit={form.onSubmit(() => void submit())}>
          <Stack gap="lg">
            <MoviePicker
              selected={movie}
              error={movieError}
              onSelect={(selected) => {
                setMovie(selected);
                setMovieError(undefined);
              }}
            />
            <Group justify="flex-end">
              <Button
                type="button"
                variant="subtle"
                leftSection={<AppIcon path={mdiClose} />}
                onClick={() => void navigate(ROUTES.organizerExhibitions)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                type="submit"
                loading={submitting}
                leftSection={<AppIcon path={mdiPlus} />}
              >
                {t('exhibitions.form.create')}
              </Button>
            </Group>
          </Stack>
        </form>
      </Paper>
    </Stack>
  );
}
