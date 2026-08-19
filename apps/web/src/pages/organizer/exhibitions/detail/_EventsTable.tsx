import { Button, Group, Paper, Stack, Table, Text } from '@mantine/core';
import { mdiPencil } from '@mdi/js';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import type { OrganizerEvent, PublishStatus } from '@/api/types';
import { AppBadge } from '@/components/UI/AppBadge';
import { AppIcon } from '@/components/UI/AppIcon';
import { toOrganizerEventEdit } from '@/routes/routes';
import { formatCents, formatDateTime } from '@/utils/format';
import { PublishToggle } from '../_PublishToggle';

type EventsTableProps = {
  exhibitionId: string;
  events: OrganizerEvent[];
  changingKey: string | null;
  onChangeStatus: (event: OrganizerEvent, publishStatus: PublishStatus) => void;
};

export function EventsTable({
  exhibitionId,
  events,
  changingKey,
  onChangeStatus,
}: EventsTableProps) {
  const { t } = useTranslation();

  return (
    <Paper p={{ base: 'xs', sm: 'md' }}>
      <Table.ScrollContainer minWidth={980}>
        <Table className="table-fit" verticalSpacing="sm" highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>{t('events.organizer.columns.startsAt')}</Table.Th>
              <Table.Th>{t('events.organizer.columns.venue')}</Table.Th>
              <Table.Th>{t('events.organizer.columns.prices')}</Table.Th>
              <Table.Th>{t('events.organizer.columns.cap')}</Table.Th>
              <Table.Th>{t('events.organizer.columns.status')}</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {events.map((event) => (
              <Table.Tr key={event.id}>
                <Table.Td>{formatDateTime(event.startsAt)}</Table.Td>
                <Table.Td>
                  <Stack gap={0}>
                    <Text>{event.venueName}</Text>
                    {event.venueAddress && (
                      <Text size="sm" c="dimmed">
                        {event.venueAddress}
                      </Text>
                    )}
                  </Stack>
                </Table.Td>
                <Table.Td>
                  {t('events.priceLine', {
                    full: formatCents(event.priceFull),
                    half: formatCents(event.priceHalf),
                  })}
                </Table.Td>
                <Table.Td>{event.maxTicketsPerOrder}</Table.Td>
                <Table.Td>
                  <AppBadge
                    color={
                      event.publishStatus === 'published' ? 'success' : 'dark'
                    }
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {t(`events.status.${event.publishStatus}`)}
                  </AppBadge>
                </Table.Td>
                <Table.Td>
                  <Group gap="xs" justify="flex-end" wrap="nowrap">
                    <Button
                      component={Link}
                      to={toOrganizerEventEdit(exhibitionId, event.id)}
                      variant="subtle"
                      size="compact-sm"
                      leftSection={<AppIcon path={mdiPencil} />}
                    >
                      {t('common.edit')}
                    </Button>
                    <PublishToggle
                      publishStatus={event.publishStatus}
                      loading={changingKey === event.id}
                      onToggle={() =>
                        onChangeStatus(
                          event,
                          event.publishStatus === 'published'
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
