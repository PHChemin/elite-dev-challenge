import { PrismaClient, Role } from '@prisma/client';
import { hash } from 'bcryptjs';
import { SEED_USERS } from './seed-users';

const prisma = new PrismaClient();

async function upsertUser(
  email: string,
  password: string,
  role: Role,
  organizerId?: string,
) {
  const passwordHash = await hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {
      passwordHash,
      role,
      status: 'active',
      organizerId: organizerId ?? null,
    },
    create: {
      email,
      passwordHash,
      role,
      organizerId,
    },
  });
}

async function main() {
  const organizerSeed = SEED_USERS.find((user) => user.role === Role.organizer);
  if (!organizerSeed) {
    throw new Error('Seed do organizador ausente');
  }

  const organizer = await upsertUser(
    organizerSeed.email,
    organizerSeed.password,
    Role.organizer,
  );

  for (const seed of SEED_USERS) {
    if (seed.role === Role.organizer) {
      continue;
    }
    await upsertUser(
      seed.email,
      seed.password,
      seed.role,
      seed.role === Role.gate ? organizer.id : undefined,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
