import { Role } from '@prisma/client';

export const SEED_USERS: ReadonlyArray<{
  email: string;
  password: string;
  role: Role;
}> = [
  {
    email: 'admin@phctickets.local',
    password: 'admin123',
    role: Role.admin,
  },
  {
    email: 'organizer@phctickets.local',
    password: 'organizer123',
    role: Role.organizer,
  },
  {
    email: 'customer@phctickets.local',
    password: 'customer123',
    role: Role.customer,
  },
  {
    email: 'gate@phctickets.local',
    password: 'gate123',
    role: Role.gate,
  },
];
