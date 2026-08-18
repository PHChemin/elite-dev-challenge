import type { ReactNode } from 'react';
import { NavLink, type NavLinkProps } from 'react-router-dom';

type AppNavLinkProps = {
  to: string;
  onClick?: NavLinkProps['onClick'];
  stacked?: boolean;
  children: ReactNode;
};

export function AppNavLink({
  to,
  onClick,
  stacked = false,
  children,
}: AppNavLinkProps) {
  return (
    <NavLink
      to={to}
      end={to === '/'}
      onClick={onClick}
      className={({ isActive }) =>
        [
          'app-nav-link',
          stacked ? 'app-nav-link--stacked' : undefined,
          isActive ? 'app-nav-link--active' : undefined,
        ]
          .filter(Boolean)
          .join(' ')
      }
    >
      {children}
    </NavLink>
  );
}
