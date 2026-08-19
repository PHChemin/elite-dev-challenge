import {
  ActionIcon,
  Group,
  NumberInput,
  Paper,
  SimpleGrid,
  TextInput,
  Title,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { mdiClose } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/UI/AppIcon';
import { MoneyInput } from '@/components/UI/MoneyInput';
import type { BatchFormValues } from './create/_event-batch';
import { MAX_TICKETS_PER_ORDER_LIMIT } from '@/utils/tickets';

type EventModelCardProps = {
  index: number;
  form: UseFormReturnType<BatchFormValues>;
  hideVenue: boolean;
  hidePrice: boolean;
  halfKey: number;
  canRemove: boolean;
  onRemove: () => void;
  onPriceFullChange: (value: number | string) => void;
  onPriceFullBlur: () => void;
  onPriceHalfChange: (value: number | string) => void;
};

export function EventModelCard({
  index,
  form,
  hideVenue,
  hidePrice,
  halfKey,
  canRemove,
  onRemove,
  onPriceFullChange,
  onPriceFullBlur,
  onPriceHalfChange,
}: EventModelCardProps) {
  const { t } = useTranslation();
  const daily = form.values.mode === 'daily';
  const halfValue = form.values.models[index]?.priceHalf;

  return (
    <Paper p={{ base: 'md', sm: 'lg' }} withBorder>
      <Group justify="space-between" align="flex-start" wrap="nowrap" mb="md">
        <Title order={3} fz="h5" ta="left">
          {t('events.batch.eventLabel', { n: index + 1 })}
        </Title>
        {canRemove && (
          <ActionIcon
            variant="subtle"
            color="brand"
            aria-label={t('events.batch.remove')}
            onClick={onRemove}
          >
            <AppIcon path={mdiClose} />
          </ActionIcon>
        )}
      </Group>

      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        {daily ? (
          <>
            <TextInput
              label={t('events.form.date')}
              value={t('events.batch.dailyPlaceholder')}
              disabled
            />
            <TextInput
              type="time"
              label={t('events.form.time')}
              {...form.getInputProps(`models.${index}.time`)}
            />
          </>
        ) : (
          <TextInput
            type="datetime-local"
            label={t('events.form.startsAt')}
            {...form.getInputProps(`models.${index}.startsAt`)}
          />
        )}

        {!hideVenue && (
          <>
            <TextInput
              label={t('events.form.venueName')}
              placeholder={t('events.form.venueNamePlaceholder')}
              {...form.getInputProps(`models.${index}.venueName`)}
            />
            <TextInput
              label={t('events.form.venueAddress')}
              placeholder={t('events.form.venueAddressPlaceholder')}
              {...form.getInputProps(`models.${index}.venueAddress`)}
            />
          </>
        )}

        {!hidePrice && (
          <>
            <MoneyInput
              label={t('events.form.priceFull')}
              value={form.values.models[index]?.priceFull}
              error={form.errors[`models.${index}.priceFull`]}
              onChange={onPriceFullChange}
              onBlur={onPriceFullBlur}
            />
            <MoneyInput
              key={`half-${index}-${halfKey}`}
              label={t('events.form.priceHalf')}
              value={halfValue}
              error={form.errors[`models.${index}.priceHalf`]}
              onChange={onPriceHalfChange}
            />
          </>
        )}

        <NumberInput
          label={t('events.form.maxTicketsPerOrder')}
          description={t('events.form.maxTicketsPerOrderHint')}
          min={1}
          max={MAX_TICKETS_PER_ORDER_LIMIT}
          allowDecimal={false}
          allowNegative={false}
          {...form.getInputProps(`models.${index}.maxTicketsPerOrder`)}
        />
      </SimpleGrid>
    </Paper>
  );
}
