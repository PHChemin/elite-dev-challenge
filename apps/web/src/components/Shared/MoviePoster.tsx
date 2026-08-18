import { Center, Image, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

type MoviePosterProps = {
  src: string | null;
  alt: string;
  height: number | string;
  width?: number | string;
};

export function MoviePoster({ src, alt, height, width }: MoviePosterProps) {
  const { t } = useTranslation();

  if (!src) {
    return (
      <Center
        h={height}
        w={width}
        bg="brand.1"
        style={{ borderRadius: 'var(--mantine-radius-sm)', flexShrink: 0 }}
      >
        <Text size="sm" c="brand.6" ta="center" px="sm">
          {t('exhibitions.noPoster')}
        </Text>
      </Center>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      h={height}
      w={width}
      radius="sm"
      fit="cover"
      loading="lazy"
    />
  );
}
