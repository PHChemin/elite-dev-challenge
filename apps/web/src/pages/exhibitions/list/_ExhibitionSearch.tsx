import { TextInput } from '@mantine/core';
import { mdiMagnify } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '@/components/UI/AppIcon';

export function ExhibitionSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { t } = useTranslation();

  return (
    <TextInput
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder={t('exhibitions.list.searchPlaceholder')}
      leftSection={<AppIcon path={mdiMagnify} size={18} />}
      aria-label={t('exhibitions.list.searchLabel')}
      size="md"
    />
  );
}
