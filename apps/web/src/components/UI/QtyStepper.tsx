import { ActionIcon, Group, Stack, Text } from '@mantine/core';
import { mdiMinus, mdiPlus } from '@mdi/js';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/UI/AppIcon';

export function QtyStepper({
  label,
  value,
  min,
  max,
  error,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  error?: ReactNode;
  onChange: (value: number) => void;
}) {
  const { t } = useTranslation();
  return (
    <Stack gap={6}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <Group gap="sm" wrap="nowrap">
        <ActionIcon
          variant="outline"
          color="brand.6"
          size="lg"
          aria-label={`${t('events.buy.minus')} ${label}`}
          disabled={value <= min}
          onClick={() => onChange(value - 1)}
        >
          <AppIcon path={mdiMinus} />
        </ActionIcon>
        <Text w={36} ta="center" fw={700} fz="lg">
          {value}
        </Text>
        <ActionIcon
          variant="outline"
          color="brand.6"
          size="lg"
          aria-label={`${t('events.buy.plus')} ${label}`}
          disabled={value >= max}
          onClick={() => onChange(value + 1)}
        >
          <AppIcon path={mdiPlus} />
        </ActionIcon>
      </Group>
      {error && (
        <Text size="xs" c="red">
          {error}
        </Text>
      )}
    </Stack>
  );
}
