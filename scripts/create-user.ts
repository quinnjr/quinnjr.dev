import 'reflect-metadata';

import { PrismaClient } from '../src/generated/prisma/client';
import { PasswordService } from '../src/server/services/password.service';

// Usage: pnpm user:create <email> <name> <password> [role]
async function main(): Promise<void> {
  const [email, name, password, role = 'VIEWER'] = process.argv.slice(2);
  if (!email || !name || !password) {
    // eslint-disable-next-line no-console
    console.error('Usage: pnpm user:create <email> <name> <password> [role]');
    process.exit(1);
  }
  const prisma = new PrismaClient();
  const passwordHash = await new PasswordService().hash(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: role as never },
    create: { email, name, passwordHash, role: role as never },
  });
  // eslint-disable-next-line no-console
  console.log('✓ User upserted:', user.email, '(', user.role, ')');
  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
