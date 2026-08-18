import { Alert, Button, Center, Group, Loader } from '@mantine/core';
import { mdiRefresh } from '@mdi/js';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './AppIcon';

type AsyncSectionProps = {
  loading: boolean;
  error: string | null;
  onRetry?: () => void;
  children: ReactNode;
};

/** Estado de carregamento e de erro de uma tela que lê da API. */
export function AsyncSection({
  loading,
  error,
  onRetry,
  children,
}: AsyncSectionProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Center py="xl">
        <Loader color="brand.6" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert color="brand.4" title={t('errors.title')}>
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          {error}
          {onRetry && (
            <Button
              variant="outline"
              size="compact-sm"
              leftSection={<AppIcon path={mdiRefresh} />}
              onClick={onRetry}
            >
              {t('common.retry')}
            </Button>
          )}
        </Group>
      </Alert>
    );
  }

  return children;
}
