import { Button, type ButtonProps } from '@mantine/core';
import { mdiFileDocumentOutline, mdiPublish } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import type { PublishStatus } from '@/api/types';
import { AppIcon } from '@/components/UI/AppIcon';

type PublishToggleProps = {
  publishStatus: PublishStatus;
  loading: boolean;
  onToggle: () => void;
  variant?: 'outline' | 'filled';
  size?: ButtonProps['size'];
};

export function PublishToggle({
  publishStatus,
  loading,
  onToggle,
  variant = 'outline',
  size = 'compact-sm',
}: PublishToggleProps) {
  const { t } = useTranslation();

  return (
    <Button
      variant={variant}
      size={size}
      loading={loading}
      leftSection={
        <AppIcon
          path={
            publishStatus === 'published'
              ? mdiFileDocumentOutline
              : mdiPublish
          }
        />
      }
      onClick={onToggle}
    >
      {publishStatus === 'published'
        ? t('exhibitions.organizer.unpublish')
        : t('exhibitions.organizer.publish')}
    </Button>
  );
}
