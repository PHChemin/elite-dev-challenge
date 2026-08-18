import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '@/api/types';
import { useAuth } from '@/auth/useAuth';
import { homeForRole, ROUTES } from './routes';

type RequireRoleProps = {
  roles: Role[];
  children: ReactNode;
};

/**
 * Esconde a tela de quem não tem o papel. A API recusa a operação de qualquer
 * forma; aqui a rota só evita mostrar um formulário que não vai ser aceito.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={ROUTES.login} state={{ from: location }} replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={homeForRole(user.role)} replace />;
  }
  return children;
}
