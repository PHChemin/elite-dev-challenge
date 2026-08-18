import {
  Alert,
  Button,
  Group,
  SegmentedControl,
  Stack,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { mdiClose, mdiPlus } from '@mdi/js';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '@/api/client';
import { createExhibitionEvents } from '@/api/events';
import { getMyExhibition } from '@/api/exhibitions';
import { useApiResource } from '@/api/useApiResource';
import { AppIcon } from '@/components/UI/AppIcon';
import { AsyncSection } from '@/components/UI/AsyncSection';
import { PageBreadcrumbs } from '@/components/UI/PageBreadcrumbs';
import { PageTitle } from '@/components/UI/PageTitle';
import { ROUTES, toOrganizerExhibition } from '@/routes/routes';
import { daysInRange } from '@/utils/format';
import { halfReaisFromFull } from '@/utils/number';
import {
  DEFAULT_MAX_TICKETS_PER_ORDER,
  MAX_EVENTS_PER_REQUEST,
} from '@/utils/tickets';
import { SessionModelCard } from '../_SessionModelCard';
import { DailyBatchPanel } from './_DailyBatchPanel';
import { batchFormValidate, expandFailureMessage } from './_helpers';
import {
  emptySessionModel,
  expandSessionModels,
  maxModelsForPeriod,
  previewEventCount,
  resizeModels,
  type BatchFormValues,
  type SessionMode,
} from './_session-batch';

export function CreateEventsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const load = useCallback(() => getMyExhibition(id ?? ''), [id]);
  const { data, loading, error, reload } = useApiResource(load);
  const [halfEdited, setHalfEdited] = useState<boolean[]>([false]);
  const [halfStamp, setHalfStamp] = useState<number[]>([0]);
  const [sharedHalfEdited, setSharedHalfEdited] = useState(false);
  const [sharedHalfStamp, setSharedHalfStamp] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<BatchFormValues>({
    initialValues: {
      mode: 'manual',
      periodFrom: '',
      periodTo: '',
      quantity: 1,
      sameVenue: false,
      sharedVenueName: '',
      sharedVenueAddress: '',
      samePrice: false,
      sharedPriceFull: '',
      sharedPriceHalf: '',
      models: [emptySessionModel(DEFAULT_MAX_TICKETS_PER_ORDER)],
    },
    validate: batchFormValidate(t),
  });

  const days = daysInRange(form.values.periodFrom, form.values.periodTo);
  const previewCount = previewEventCount(form.values);
  const overLimit = previewCount > MAX_EVENTS_PER_REQUEST;
  const quantityMax = maxModelsForPeriod(
    form.values.periodFrom,
    form.values.periodTo,
  );
  const backTo = toOrganizerExhibition(id ?? '');

  function setMode(mode: SessionMode) {
    if (mode === 'manual') {
      form.setFieldValue(
        'models',
        form.values.models.map((model) => ({
          ...model,
          venueName: form.values.sameVenue
            ? form.values.sharedVenueName
            : model.venueName,
          venueAddress: form.values.sameVenue
            ? form.values.sharedVenueAddress
            : model.venueAddress,
          priceFull: form.values.samePrice
            ? form.values.sharedPriceFull
            : model.priceFull,
          priceHalf: form.values.samePrice
            ? form.values.sharedPriceHalf
            : model.priceHalf,
        })),
      );
    }
    form.setFieldValue('mode', mode);
  }

  function setQuantity(next: number) {
    const models = resizeModels(
      form.values.models,
      next,
      DEFAULT_MAX_TICKETS_PER_ORDER,
    );
    form.setFieldValue('models', models);
    form.setFieldValue('quantity', models.length);
    setHalfEdited((current) => {
      if (models.length > current.length) {
        return [
          ...current,
          ...Array.from({ length: models.length - current.length }, () => false),
        ];
      }
      return current.slice(0, models.length);
    });
    setHalfStamp((current) => {
      if (models.length > current.length) {
        return [
          ...current,
          ...Array.from({ length: models.length - current.length }, () => 0),
        ];
      }
      return current.slice(0, models.length);
    });
  }

  function addModel() {
    setQuantity(form.values.models.length + 1);
  }

  function removeModel(index: number) {
    if (form.values.models.length <= 1) {
      return;
    }
    form.removeListItem('models', index);
    form.setFieldValue('quantity', form.values.models.length - 1);
    setHalfEdited((current) => current.filter((_, item) => item !== index));
    setHalfStamp((current) => current.filter((_, item) => item !== index));
  }

  function suggestHalf(index: number, priceFull: number | string) {
    if (halfEdited[index]) {
      return;
    }
    const half = halfReaisFromFull(priceFull);
    if (half === null) {
      return;
    }
    form.setFieldValue(`models.${index}.priceHalf`, half);
    setHalfStamp((current) =>
      current.map((stamp, item) => (item === index ? stamp + 1 : stamp)),
    );
  }

  function suggestSharedHalf(priceFull: number | string) {
    if (sharedHalfEdited) {
      return;
    }
    const half = halfReaisFromFull(priceFull);
    if (half === null) {
      return;
    }
    form.setFieldValue('sharedPriceHalf', half);
    setSharedHalfStamp((stamp) => stamp + 1);
  }

  async function submit(values: BatchFormValues) {
    if (!id || overLimit) {
      return;
    }
    const expanded = expandSessionModels(values);
    if (expanded.ok === false) {
      notifications.show({
        title: t('events.batch.failed'),
        message: expandFailureMessage(expanded.reason, t),
        color: 'brand.4',
      });
      return;
    }

    setSubmitting(true);
    try {
      await createExhibitionEvents(id, expanded.events);
      notifications.show({
        title: t('events.batch.created', { count: expanded.events.length }),
        message: data?.title,
        color: 'success.5',
      });
      void navigate(backTo);
    } catch (cause) {
      notifications.show({
        title: t('events.batch.failed'),
        message:
          cause instanceof ApiError
            ? cause.message
            : t('errors.api.requestFailed'),
        color: 'brand.4',
      });
    } finally {
      setSubmitting(false);
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
                { label: data.title, to: backTo },
                { label: t('events.batch.title') },
              ]}
            />
            <PageTitle>{t('events.batch.title')}</PageTitle>
            <Text ta="center" c="dimmed">
              {data.title}
            </Text>

            <form onSubmit={form.onSubmit((values) => void submit(values))}>
              <Stack gap="lg">
                <SegmentedControl
                  fullWidth
                  color="brand"
                  className="session-mode-control"
                  value={form.values.mode}
                  onChange={(value) => setMode(value as SessionMode)}
                  data={[
                    {
                      value: 'manual',
                      label: t('events.batch.manual'),
                    },
                    { value: 'daily', label: t('events.batch.daily') },
                  ]}
                />

                {form.values.mode === 'daily' && (
                  <DailyBatchPanel
                    form={form}
                    quantityMax={quantityMax}
                    days={days.length}
                    previewCount={previewCount}
                    sharedHalfStamp={sharedHalfStamp}
                    onQuantityChange={setQuantity}
                    onSharedPriceFullBlur={() => {
                      suggestSharedHalf(form.values.sharedPriceFull);
                    }}
                    onSharedPriceHalfChange={(value) => {
                      setSharedHalfEdited(true);
                      form.setFieldValue('sharedPriceHalf', value);
                    }}
                  />
                )}

                {overLimit && (
                  <Alert color="brand.4" title={t('errors.title')}>
                    {t('events.batch.limit', { max: MAX_EVENTS_PER_REQUEST })}
                  </Alert>
                )}

                <Stack gap="md">
                  {form.values.models.map((_, index) => (
                    <SessionModelCard
                      key={index}
                      index={index}
                      form={form}
                      hideVenue={
                        form.values.mode === 'daily' && form.values.sameVenue
                      }
                      hidePrice={
                        form.values.mode === 'daily' && form.values.samePrice
                      }
                      halfKey={halfStamp[index] ?? 0}
                      canRemove={form.values.models.length > 1}
                      onRemove={() => removeModel(index)}
                      onPriceFullChange={(value) => {
                        form.setFieldValue(`models.${index}.priceFull`, value);
                      }}
                      onPriceFullBlur={() => {
                        suggestHalf(
                          index,
                          form.values.models[index]?.priceFull ?? '',
                        );
                      }}
                      onPriceHalfChange={(value) => {
                        setHalfEdited((current) =>
                          current.map((edited, item) =>
                            item === index ? true : edited,
                          ),
                        );
                        form.setFieldValue(`models.${index}.priceHalf`, value);
                      }}
                    />
                  ))}
                </Stack>

                {(form.values.mode === 'manual'
                  ? form.values.models.length < MAX_EVENTS_PER_REQUEST
                  : form.values.models.length < quantityMax) && (
                  <Button
                    type="button"
                    variant="outline"
                    leftSection={<AppIcon path={mdiPlus} />}
                    onClick={addModel}
                  >
                    {t('events.batch.add')}
                  </Button>
                )}

                {!overLimit && previewCount > 0 && (
                  <Text size="sm" c="dimmed">
                    {t('events.batch.preview', { count: previewCount })}
                  </Text>
                )}

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
                    disabled={overLimit}
                    leftSection={<AppIcon path={mdiPlus} />}
                  >
                    {t('events.batch.create')}
                  </Button>
                </Group>
              </Stack>
            </form>
          </Stack>
        )}
      </AsyncSection>
    </Stack>
  );
}
