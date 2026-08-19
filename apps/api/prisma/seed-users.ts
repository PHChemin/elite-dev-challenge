import { Role } from '@prisma/client';

export function seedUserIdFromEmail(email: string): string {
  const localPart = email.split('@')[0]?.replace(/\./g, '-') ?? 'user';
  return `user-${localPart}`;
}

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
    email: 'customer2@phctickets.local',
    password: 'customer123',
    role: Role.customer,
  },
  {
    email: 'gate@phctickets.local',
    password: 'gate123',
    role: Role.gate,
  },
];

export const SEED_DEMO = {
  exhibitionId: '11111111-1111-4111-8111-111111111101',
  eventId: '11111111-1111-4111-8111-111111111102',
  holdId: '11111111-1111-4111-8111-111111111104',
  orderId: '11111111-1111-4111-8111-111111111103',
  seatA1Id: '11111111-1111-4111-8111-111111111105',
  ticketId: '11111111-1111-4111-8111-111111111106',
  ticketCode: 'cccccccccccccccccccccccccccccccc',
  shareToken: 'dddddddddddddddddddddddddddddddd',
  startsAt: '2026-12-15T19:00:00.000Z',
  venueName: 'Cine PHC',
} as const;
