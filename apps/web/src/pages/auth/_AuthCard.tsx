import { Paper, type PaperProps } from '@mantine/core';
import type { ReactNode } from 'react';

const AUTH_CARD_MAX_WIDTH = 420;

type AuthCardProps = PaperProps & {
  children: ReactNode;
};

export function AuthCard({ children, ...props }: AuthCardProps) {
  return (
    <Paper w="100%" maw={AUTH_CARD_MAX_WIDTH} p={{ base: 'lg', sm: 'xl' }} {...props}>
      {children}
    </Paper>
  );
}
