import {
  Button,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { mdiClose, mdiContentSave } from '@mdi/js';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { updateEvent } from '@/api/events';
import { getMyExhibition } from '@/api/exhibitions';
import { useApiResource } from '@/api/useApiResource';
import { MoviePoster } from '@/components/Shared/MoviePoster';
import { AppIcon } from '@/components/UI/AppIcon';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { MoneyInput } from '@/components/UI/MoneyInput';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { PageTitle } from '@/components/UI/PageTitle';
import { ROUTES, toOrganizerExhibition } from '@/routes/routes';
import {
  centsToReais,
  reaisToCents,
  toDateTimeLocalValue,
} from '@/utils/format';
import { halfReaisFromFull, toNumber } from '@/utils/number';
import {
  DEFAULT_MAX_TICKETS_PER_ORDER,
  MAX_TICKETS_PER_ORDER_LIMIT,
} from '@/utils/tickets';
import { toUpdateEventPayload, type EventFormValues } from './_payload';

export function EventFormPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { exhibitionId, eventId } = useParams<{
    exhibitionId: string;
    eventId: string;
  }>();
  const load = useCallback(
    () => getMyExhibition(exhibitionId ?? ''),
    [exhibitionId],
  );
  const { data, loading, error, reload } = useApiResource(load);
  const event = data?.events.find((item) => item.id === eventId);
  const backTo = toOrganizerExhibition(exhibitionId ?? '');

  const [halfEdited, setHalfEdited] = useState(true);
  const [halfStamp, setHalfStamp] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<EventFormValues>({
    initialValues: {
      startsAt: '',
      venueName: '',
      venueAddress: '',
      priceFull: '',
      priceHalf: '',
      maxTicketsPerOrder: DEFAULT_MAX_TICKETS_PER_ORDER,
    },
    validate: {
      startsAt: (value) =>
        value.length > 0 ? null : t('validation.startsAt.invalid'),
      venueName: (value) =>
        value.trim().length > 0 ? null : t('validation.venueName.required'),
      priceFull: (value) => {
        const reais = toNumber(value);
        return reais !== null && reaisToCents(reais) >= 1
          ? null
          : t('validation.priceFull.invalid');
      },
    },
  });
  const setFormValues = form.setValues;

  useEffect(() => {
    if (!event) {
      return;
    }
    setFormValues({
      startsAt: toDateTimeLocalValue(event.startsAt),
      venueName: event.venueName,
      venueAddress: event.venueAddress ?? '',
      priceFull: centsToReais(event.priceFull),
      priceHalf: centsToReais(event.priceHalf),
      maxTicketsPerOrder: event.maxTicketsPerOrder,
    });
  }, [event, setFormValues]);

  function suggestHalf(priceFull: number | string) {
    if (halfEdited) {
      return;
    }
    const half = halfReaisFromFull(priceFull);
    if (half === null) {
      return;
    }
    form.setFieldValue('priceHalf', half);
    setHalfStamp((stamp) => stamp + 1);
  }

  async function submit(values: EventFormValues) {
    if (!eventId) {
      return;
    }

    setSubmitting(true);
    try {
      await updateEvent(eventId, toUpdateEventPayload(values));
      notifications.show({
        title: t('events.form.saved'),
        message: data?.title,
        color: 'success.5',
      });
      void navigate(backTo);
    } catch (cause) {
      if (cause instanceof ApiError) {
        form.setErrors({
          startsAt: cause.fieldErrors.startsAt?.[0],
          venueName: cause.fieldErrors.venueName?.[0],
          venueAddress: cause.fieldErrors.venueAddress?.[0],
          priceFull: cause.fieldErrors.priceFull?.[0],
          priceHalf: cause.fieldErrors.priceHalf?.[0],
          maxTicketsPerOrder: cause.fieldErrors.maxTicketsPerOrder?.[0],
        });
        if (Object.keys(cause.fieldErrors).length === 0) {
          notifications.show({
            title: t('events.form.failed'),
            message: cause.message,
            color: 'brand.4',
          });
        }
      } else {
        notifications.show({
          title: t('events.form.failed'),
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
          { label: data?.title ?? t('events.form.editTitle'), to: backTo },
          { label: t('events.form.editTitle') },
        ]}
      />
      <PageTitle>{t('events.form.editTitle')}</PageTitle>
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && !event && (
          <Paper p="xl">
            {t('events.form.notFound')}
          </Paper>
        )}
        {event && (
          <Paper p={{ base: 'md', sm: 'xl' }}>
            <form onSubmit={form.onSubmit((values) => void submit(values))}>
              <Stack gap="lg">
                <Group align="flex-start" gap="md" wrap="nowrap">
                  <MoviePoster
                    src={data?.posterUrl ?? null}
                    alt={data?.title ?? ''}
                    width={80}
                    height={120}
                  />
                  <Stack gap={4}>
                    <Text fw={500}>{data?.title}</Text>
                    <Text size="sm" c="dimmed">
                      {t('events.form.editTitle')}
                    </Text>
                  </Stack>
                </Group>

                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  <TextInput
                    type="datetime-local"
                    label={t('events.form.startsAt')}
                    {...form.getInputProps('startsAt')}
                  />
                  <TextInput
                    label={t('events.form.venueName')}
                    placeholder={t('events.form.venueNamePlaceholder')}
                    {...form.getInputProps('venueName')}
                  />
                  <TextInput
                    label={t('events.form.venueAddress')}
                    placeholder={t('events.form.venueAddressPlaceholder')}
                    {...form.getInputProps('venueAddress')}
                  />
                  <MoneyInput
                    label={t('events.form.priceFull')}
                    value={form.values.priceFull}
                    error={form.errors.priceFull}
                    onChange={(value) => {
                      form.setFieldValue('priceFull', value);
                    }}
                    onBlur={() => suggestHalf(form.values.priceFull)}
                  />
                  <MoneyInput
                    key={`half-${halfStamp}`}
                    label={t('events.form.priceHalf')}
                    value={form.values.priceHalf}
                    error={form.errors.priceHalf}
                    onChange={(value) => {
                      setHalfEdited(true);
                      form.setFieldValue('priceHalf', value);
                    }}
                  />
                  <NumberInput
                    label={t('events.form.maxTicketsPerOrder')}
                    description={t('events.form.maxTicketsPerOrderHint')}
                    min={1}
                    max={MAX_TICKETS_PER_ORDER_LIMIT}
                    allowDecimal={false}
                    allowNegative={false}
                    {...form.getInputProps('maxTicketsPerOrder')}
                  />
                </SimpleGrid>

                <Group justify="flex-end">
                  <Button
                    type="button"
                    variant="subtle"
                    leftSection={<AppIcon path={mdiClose} />}
                    onClick={() => void navigate(backTo)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    loading={submitting}
                    leftSection={<AppIcon path={mdiContentSave} />}
                  >
                    {t('events.form.save')}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        )}
      </AsyncSection>
    </Stack>
  );
}
