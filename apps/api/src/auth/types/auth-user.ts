import { Role } from '@prisma/client';

export type JwtPayload = {
  sub: string;
  role: Role;
};

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};
