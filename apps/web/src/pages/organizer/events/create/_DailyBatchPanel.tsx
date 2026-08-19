import {
  NumberInput,
  Paper,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Title,
} from '@mantine/core';
import type { UseFormReturnType } from '@mantine/form';
import { useTranslation } from 'react-i18next';
import { MoneyInput } from '@/components/UI/MoneyInput';
import type { BatchFormValues } from './_event-batch';

type DailyBatchPanelProps = {
  form: UseFormReturnType<BatchFormValues>;
  quantityMax: number;
  days: number;
  previewCount: number;
  sharedHalfStamp: number;
  onQuantityChange: (value: number) => void;
  onSharedPriceFullBlur: () => void;
  onSharedPriceHalfChange: (value: number | string) => void;
};

export function DailyBatchPanel({
  form,
  quantityMax,
  days,
  previewCount,
  sharedHalfStamp,
  onQuantityChange,
  onSharedPriceFullBlur,
  onSharedPriceHalfChange,
}: DailyBatchPanelProps) {
  const { t } = useTranslation();

  return (
    <Paper p={{ base: 'md', sm: 'lg' }} withBorder>
      <Stack gap="md">
        <Title order={3} fz="h5" ta="left">
          {t('events.batch.filters')}
        </Title>
        <Text size="sm" c="dimmed">
          {t('events.batch.dailyHelp')}
        </Text>
        <SimpleGrid cols={{ base: 1, sm: 3 }} spacing="md">
          <TextInput
            type="date"
            label={t('events.batch.periodFrom')}
            {...form.getInputProps('periodFrom')}
          />
          <TextInput
            type="date"
            label={t('events.batch.periodTo')}
            {...form.getInputProps('periodTo')}
          />
          <NumberInput
            label={t('events.batch.quantity')}
            min={1}
            max={quantityMax}
            allowDecimal={false}
            allowNegative={false}
            value={form.values.quantity}
            onChange={(value) =>
              onQuantityChange(typeof value === 'number' ? value : 1)
            }
          />
        </SimpleGrid>
        <Switch
          label={t('events.batch.sameVenue')}
          checked={form.values.sameVenue}
          onChange={(event) =>
            form.setFieldValue('sameVenue', event.currentTarget.checked)
          }
        />
        {form.values.sameVenue && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <TextInput
              label={t('events.form.venueName')}
              placeholder={t('events.form.venueNamePlaceholder')}
              {...form.getInputProps('sharedVenueName')}
            />
            <TextInput
              label={t('events.form.venueAddress')}
              placeholder={t('events.form.venueAddressPlaceholder')}
              {...form.getInputProps('sharedVenueAddress')}
            />
          </SimpleGrid>
        )}
        <Switch
          label={t('events.batch.samePrice')}
          checked={form.values.samePrice}
          onChange={(event) => {
            const checked = event.currentTarget.checked;
            form.setFieldValue('samePrice', checked);
            if (checked) {
              const first = form.values.models[0];
              form.setFieldValue('sharedPriceFull', first?.priceFull ?? '');
              form.setFieldValue('sharedPriceHalf', first?.priceHalf ?? '');
            }
          }}
        />
        {form.values.samePrice && (
          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
            <MoneyInput
              label={t('events.form.priceFull')}
              value={form.values.sharedPriceFull}
              error={form.errors.sharedPriceFull}
              onChange={(value) => {
                form.setFieldValue('sharedPriceFull', value);
              }}
              onBlur={onSharedPriceFullBlur}
            />
            <MoneyInput
              key={`shared-half-${sharedHalfStamp}`}
              label={t('events.form.priceHalf')}
              value={form.values.sharedPriceHalf}
              error={form.errors.sharedPriceHalf}
              onChange={onSharedPriceHalfChange}
            />
          </SimpleGrid>
        )}
        {days > 0 && (
          <Text size="sm" c="dimmed">
            {t('events.batch.previewDaily', {
              models: form.values.models.length,
              days,
              total: previewCount,
            })}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
