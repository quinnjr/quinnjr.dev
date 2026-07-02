import 'reflect-metadata';

import { PrismaClient, UserRole } from '../src/generated/prisma/client';
import { PasswordService } from '../src/server/services/password.service';

const ROLES = Object.values(UserRole);

// Usage: pnpm user:create <email> <name> <password> [role]
async function main(): Promise<void> {
  const [email, name, password, role = UserRole.VIEWER] = process.argv.slice(2);
  if (!email || !name || !password) {
    console.error('Usage: pnpm user:create <email> <name> <password> [role]');
    process.exit(1);
  }
  if (!ROLES.includes(role as UserRole)) {
    console.error(`Invalid role "${role}". Must be one of: ${ROLES.join(', ')}`);
    process.exit(1);
  }
  const userRole = role as UserRole;
  const prisma = new PrismaClient();
  const passwordHash = await new PasswordService().hash(password);
  const user = await prisma.user.upsert({
    where: { email },
    update: { name, passwordHash, role: userRole },
    create: { email, name, passwordHash, role: userRole },
  });

  console.log('✓ User upserted:', user.email, '(', user.role, ')');
  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
