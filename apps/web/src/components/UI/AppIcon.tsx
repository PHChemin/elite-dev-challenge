import { Icon } from '@mdi/react';

type AppIconProps = {
  path: string;
  size?: number;
};

export function AppIcon({ path, size = 0.85 }: AppIconProps) {
  return <Icon path={path} size={size} color="currentColor" />;
}
