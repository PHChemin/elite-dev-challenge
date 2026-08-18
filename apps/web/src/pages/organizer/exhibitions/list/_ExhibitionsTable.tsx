import { Button, Group, Paper, Table, Text } from '@mantine/core';
import { mdiOpenInNew } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { OrganizerExhibitionSummary, PublishStatus } from '@/api/types';
import { AppBadge } from '@/components/UI/AppBadge';
import { AppIcon } from '@/components/UI/AppIcon';
import { toOrganizerExhibition } from '@/routes/routes';
import { formatDateTime } from '@/utils/format';
import { formatSessionCount } from '@/utils/text';
import { PublishToggle } from '../_PublishToggle';

type ExhibitionsTableProps = {
  exhibitions: OrganizerExhibitionSummary[];
  changingId: string | null;
  onChangeStatus: (
    exhibition: OrganizerExhibitionSummary,
    publishStatus: PublishStatus,
  ) => void;
};

export function ExhibitionsTable({
  exhibitions,
  changingId,
  onChangeStatus,
}: ExhibitionsTableProps) {
  const { t } = useTranslation();

  return (
    <Paper p={{ base: 'xs', sm: 'md' }}>
      <Table.ScrollContainer minWidth={980}>
        <Table className="table-fit" verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('exhibitions.organizer.columns.movie')}</Table.Th>
              <Table.Th>{t('exhibitions.organizer.columns.next')}</Table.Th>
              <Table.Th>
                {t('exhibitions.organizer.columns.sessions')}
              </Table.Th>
              <Table.Th>{t('exhibitions.organizer.columns.status')}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {exhibitions.map((exhibition) => (
              <Table.Tr key={exhibition.id}>
                <Table.Td>
                  <Text fw={500}>{exhibition.title}</Text>
                </Table.Td>
                <Table.Td>
                  {exhibition.nextStartsAt
                    ? formatDateTime(exhibition.nextStartsAt)
                    : t('exhibitions.noNextSession')}
                </Table.Td>
                <Table.Td>
                  {formatSessionCount(exhibition.eventCount, t)}
                </Table.Td>
                <Table.Td>
                  <AppBadge
                    color={
                      exhibition.publishStatus === 'published'
                        ? 'success'
                        : 'dark'
                    }
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {t(`exhibitions.status.${exhibition.publishStatus}`)}
                  </AppBadge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Button
                      component={Link}
                      to={toOrganizerExhibition(exhibition.id)}
                      variant="subtle"
                      size="compact-sm"
                      leftSection={<AppIcon path={mdiOpenInNew} />}
                    >
                      {t('common.open')}
                    </Button>
                    <PublishToggle
                      publishStatus={exhibition.publishStatus}
                      loading={changingId === exhibition.id}
                      onToggle={() =>
                        onChangeStatus(
                          exhibition,
                          exhibition.publishStatus === 'published'
                            ? 'draft'
                            : 'published',
                        )
                      }
                    />
                  </Group>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    </Paper>
  );
}
