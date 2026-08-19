import { Paper, Stack, Text, Title } from '@mantine/core';
import { useTranslation } from 'react-i18next';
import type { GateScanStatus } from '@/api/types';

type ScanResultProps = {
  status: GateScanStatus;
  seatLabel?: string;
};

type StatusStyle = {
  bg: string;
  borderColor: string;
  c: string;
  titleOrder: 2 | 3;
};

const STATUS_STYLE: Record<GateScanStatus, StatusStyle> = {
  valid: {
    bg: 'success.0',
    borderColor: 'var(--mantine-color-success-4)',
    c: 'success.6',
    titleOrder: 2,
  },
  invalid: {
    bg: 'brand.1',
    borderColor: 'var(--mantine-color-brand-4)',
    c: 'black',
    titleOrder: 3,
  },
  already_used: {
    bg: 'brand.1',
    borderColor: 'var(--mantine-color-brand-4)',
    c: 'black',
    titleOrder: 3,
  },
  wrong_event: {
    bg: 'brand.1',
    borderColor: 'var(--mantine-color-brand-4)',
    c: 'black',
    titleOrder: 3,
  },
};

export function ScanResult({ status, seatLabel }: ScanResultProps) {
  const { t } = useTranslation();
  const style = STATUS_STYLE[status];

  return (
    <Paper
      p="lg"
      withBorder
      bg={style.bg}
      style={{ borderColor: style.borderColor }}
    >
      <Stack gap="xs" align="center">
        <Title order={style.titleOrder} c={style.c} ta="center" fz={style.titleOrder === 3 ? 'h4' : undefined}>
          {t(`gate.scan.result.${status}`)}
        </Title>
        {status === 'valid' && seatLabel && (
          <Text size="lg" fw={600}>
            {t('gate.scan.seat', { seat: seatLabel })}
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
