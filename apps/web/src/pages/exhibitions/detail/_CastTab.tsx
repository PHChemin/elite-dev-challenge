import {
  Avatar,
  Button,
  Modal,
  SimpleGrid,
  Stack,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { getMovieCredits } from '@/api/catalog';
import { useApiResource } from '@/api/useApiResource';
import { AsyncSection } from '@/components/UI/AsyncSection';

const PREVIEW_COUNT = 12;

export function CastTab({ tmdbId }: { tmdbId: string }) {
  const { t } = useTranslation();
  const [opened, { open, close }] = useDisclosure(false);
  const load = useCallback(() => getMovieCredits(tmdbId), [tmdbId]);
  const { data, loading, error, reload } = useApiResource(load);

  return (
    <Stack gap="md">
      <AsyncSection loading={loading} error={error} onRetry={reload}>
        {data && data.cast.length > 0 ? (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {data.cast.slice(0, PREVIEW_COUNT).map((member) => (
                <CastMemberCard key={`${member.name}-${member.character}`} member={member} />
              ))}
            </SimpleGrid>
            {data.cast.length > PREVIEW_COUNT && (
              <Button variant="light" onClick={open}>
                {t('exhibitions.detail.viewAllCast', {
                  count: data.cast.length,
                })}
              </Button>
            )}
            <Modal
              opened={opened}
              onClose={close}
              title={t('exhibitions.detail.castTitle')}
              size="lg"
            >
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {data.cast.map((member) => (
                  <CastMemberCard
                    key={`modal-${member.name}-${member.character}`}
                    member={member}
                  />
                ))}
              </SimpleGrid>
            </Modal>
          </>
        ) : (
          <Text c="dimmed">{t('exhibitions.detail.castEmpty')}</Text>
        )}
      </AsyncSection>
    </Stack>
  );
}

function CastMemberCard({
  member,
}: {
  member: { name: string; character: string; profileUrl: string | null };
}) {
  return (
    <Stack gap="xs" align="center">
      <Avatar src={member.profileUrl} alt={member.name} size={72} radius="md" />
      <Stack gap={2} align="center">
        <Text fw={600} size="sm" ta="center">
          {member.name}
        </Text>
        <Text size="xs" c="dimmed" ta="center" lineClamp={2}>
          {member.character}
        </Text>
      </Stack>
    </Stack>
  );
}
