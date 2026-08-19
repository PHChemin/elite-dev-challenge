import { Container, Text } from '@mantine/core';
import { useTranslation } from 'react-i18next';

export function AppFooter() {
  const { t } = useTranslation();

  return (
    <Container fluid h="100%" px={{ base: 'md', sm: 'lg', md: 40, lg: 56 }}>
      <Text
        size="sm"
        c="dimmed"
        h="100%"
        style={{ display: 'flex', alignItems: 'center' }}
      >
        {t('footer.copy', { year: new Date().getFullYear() })}
      </Text>
    </Container>
  );
}
