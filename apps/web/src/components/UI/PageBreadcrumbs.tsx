import { Anchor, Breadcrumbs, Text } from '@mantine/core';
import { mdiChevronRight } from '@mdi/js';
import { Link } from 'react-router-dom';
import { AppIcon } from './AppIcon';

export type BreadcrumbItem = {
  label: string;
  to?: string;
};

export function PageBreadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  return (
    <Breadcrumbs
      separator={<AppIcon path={mdiChevronRight} size={0.6} />}
      separatorMargin={6}
    >
      {items.map((item) =>
        item.to ? (
          <Anchor
            key={`${item.label}-${item.to}`}
            component={Link}
            to={item.to}
            size="sm"
            c="black"
            underline="hover"
          >
            {item.label}
          </Anchor>
        ) : (
          <Text key={item.label} size="sm" c="dimmed">
            {item.label}
          </Text>
        ),
      )}
    </Breadcrumbs>
  );
}
