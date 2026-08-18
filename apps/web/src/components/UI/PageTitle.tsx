import { Title, type TitleProps } from '@mantine/core';
import type { ReactNode } from 'react';

type PageTitleProps = TitleProps & {
  children: ReactNode;
};

export function PageTitle({ children, ...props }: PageTitleProps) {
  return (
    <Title order={2} ta="center" fz={{ base: 'h3', sm: 'h2' }} {...props}>
      {children}
    </Title>
  );
}
