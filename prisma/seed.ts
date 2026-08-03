import { PrismaClient } from '../src/generated/prisma/client';
import { PasswordService } from '../src/server/services/password.service';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create default SEO settings
  const seoSettings = await prisma.seoSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      siteName: 'quinnjr.dev',
      siteDescription:
        'Personal website of Joseph R. Quinn, Esq. - Developer, Lawyer, and Tech Enthusiast',
      siteKeywords: ['joseph quinn', 'developer', 'attorney', 'software engineer', 'tech blog'],
      organizationName: 'quinnjr.dev',
    },
  });

  console.log('✓ Created SEO settings:', seoSettings.id);

  // Provision the initial ADMIN user from env. Set SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD;
  // subsequent role changes can be made in Prisma Studio.
  const adminEmail = process.env['SEED_ADMIN_EMAIL'] ?? 'jquinn@lexmata.ai';
  const adminPassword = process.env['SEED_ADMIN_PASSWORD'] ?? 'change-me-locally';
  const passwordHash = await new PasswordService().hash(adminPassword);
  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { role: 'ADMIN' },
    create: {
      email: adminEmail,
      name: 'Joseph R. Quinn',
      role: 'ADMIN',
      passwordHash,
    },
  });

  console.log('✓ Created/updated admin user:', admin.email);

  // Create static sitemap routes for Angular application
  // Mirrors STATIC_ROUTES in sitemap.service.ts, which is the authoritative
  // list. `/blog` (no such route) and `/login` (noindex) are deliberately gone.
  const staticRoutes = [
    { url: '/', changefreq: 'weekly', priority: 1.0 },
    { url: '/home', changefreq: 'weekly', priority: 1.0 },
    { url: '/articles', changefreq: 'daily', priority: 0.9 },
    { url: '/resume', changefreq: 'monthly', priority: 0.8 },
    { url: '/projects', changefreq: 'weekly', priority: 0.8 },
  ];

  for (const route of staticRoutes) {
    await prisma.sitemapConfig.upsert({
      where: { url: route.url },
      update: route,
      create: {
        ...route,
        isStatic: true,
      },
    });
    console.log(`✓ Created sitemap config for: ${route.url}`);
  }

  // Create default categories
  const categories = [
    {
      name: 'Technology',
      slug: 'technology',
      description: 'Articles about technology, programming, and software development',
      seoTitle: 'Technology Articles - quinnjr.dev',
      seoDescription: 'Explore technology articles and tutorials',
    },
    {
      name: 'Law & Tech',
      slug: 'law-tech',
      description: 'Intersection of law and technology',
      seoTitle: 'Law & Technology - quinnjr.dev',
      seoDescription: 'Articles about legal aspects of technology',
    },
    {
      name: 'Tutorials',
      slug: 'tutorials',
      description: 'Step-by-step programming tutorials',
      seoTitle: 'Programming Tutorials - quinnjr.dev',
      seoDescription: 'Learn programming with detailed tutorials',
    },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: cat,
    });
    console.log(`✓ Created category: ${cat.name}`);
  }

  // Create default tags
  const tags = [
    { name: 'Angular', slug: 'angular' },
    { name: 'TypeScript', slug: 'typescript' },
    { name: 'Node.js', slug: 'nodejs' },
    { name: 'DevOps', slug: 'devops' },
    { name: 'Docker', slug: 'docker' },
    { name: 'Kubernetes', slug: 'kubernetes' },
    { name: 'Rust', slug: 'rust' },
    { name: 'Go', slug: 'go' },
    { name: 'C++', slug: 'cpp' },
    { name: 'Web Development', slug: 'web-development' },
  ];

  for (const tag of tags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
    console.log(`✓ Created tag: ${tag.name}`);
  }

  console.log('\n✅ Database seeded successfully!');
}

main()
  .catch(e => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
