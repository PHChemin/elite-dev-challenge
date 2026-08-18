import { Badge, type BadgeProps } from '@mantine/core';

export function AppBadge({
  c = 'white',
  variant = 'filled',
  tt = 'none',
  fw = 500,
  ...props
}: BadgeProps) {
  return <Badge variant={variant} c={c} tt={tt} fw={fw} {...props} />;
}
