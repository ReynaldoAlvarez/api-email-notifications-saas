import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SaaS data...');

  // Crear planes
  const plans = await Promise.all([
    prisma.plan.upsert({
      where: { slug: 'free' },
      update: {},
      create: {
        id: 'plan-free',
        name: 'Free',
        slug: 'free',
        description: 'Perfect for testing and small projects',
        price: 0.00,
        emailsPerMonth: 100,
        templatesLimit: 5,
        apiCallsPerMinute: 10,
        features: ['Basic email sending', '5 templates', 'Email logs'],
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'basic' },
      update: {},
      create: {
        id: 'plan-basic',
        name: 'Basic',
        slug: 'basic',
        description: 'Great for small businesses',
        price: 29.00,
        

emailsPerMonth: 1000,
        templatesLimit: 25,
        apiCallsPerMinute: 60,
        features: ['1,000 emails/month', '25 templates', 'Email analytics', 'Priority support'],
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'pro' },
      update: {},
      create: {
        id: 'plan-pro',
        name: 'Pro',
        slug: 'pro',
        description: 'Perfect for growing companies',
        price: 99.00,
        emailsPerMonth: 10000,
        templatesLimit: 100,
        apiCallsPerMinute: 120,
        features: ['10,000 emails/month', '100 templates', 'Advanced analytics', 'Webhook events', 'Priority support'],
      },
    }),
    prisma.plan.upsert({
      where: { slug: 'enterprise' },
      update: {},
      create: {
        id: 'plan-enterprise',
        name: 'Enterprise',
        slug: 'enterprise',
        description: 'For large organizations',
        price: 299.00,
        emailsPerMonth: 100000,
        templatesLimit: null,
        apiCallsPerMinute: 300,
        features

: ['100,000 emails/month', 'Unlimited templates', 'Advanced analytics', 'Webhook events', 'Dedicated support', 'SLA guarantee'],
      },
    }),
  ]);

  // Crear permisos por plan
  const permissions = await Promise.all([
    // Permisos básicos (Free plan)
    prisma.permission.upsert({
      where: { code: 'send_basic' },
      update: {},
      create: {
        code: 'send_basic',
        name: 'Send Basic Emails',
        description: 'Send up to plan limit emails',
        category: 'email',
        planLevel: 'free',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'templates_basic' },
      update: {},
      create: {
        code: 'templates_basic',
        name: 'Basic Templates',
        description: 'Create and use basic templates',
        category: 'template',
        planLevel: 'free',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'logs_basic' },
      update: {},
      create: {
        code: 'logs_basic',
        name: 'Basic Logs',
        

description: 'View email logs',
        category: 'logs',
        planLevel: 'free',
      },
    }),
    // Permisos estándar (Basic plan)
    prisma.permission.upsert({
      where: { code: 'send_standard' },
      update: {},
      create: {
        code: 'send_standard',
        name: 'Send Standard Emails',
        description: 'Send emails with standard features',
        category: 'email',
        planLevel: 'basic',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'analytics_basic' },
      update: {},
      create: {
        code: 'analytics_basic',
        name: 'Basic Analytics',
        description: 'View basic email analytics',
        category: 'analytics',
        planLevel: 'basic',
      },
    }),
    // Permisos avanzados (Pro plan)
    prisma.permission.upsert({
      where: { code: 'send_advanced' },
      update: {},
      create: {
        code: 'send_advanced',
        name: 'Send Advanced Emails',
        description: 'Send emails with advanced features',
        category: 'email',
        planLevel: 'pro',
      },
    }),
    prisma.permission.upsert({
      where: { code: 'webhooks' },
      update: {},
      create: {
        code: 'webhooks',
        name: 'Webhook Events',
        description: 'Receive webhook notifications',
        category: 'webhooks',
        planLevel: 'pro',
      },
    }),
    // Permisos enterprise
    prisma.permission.upsert({
      where: { code: 'send_unlimited' },
      update: {},
      create: {
        code: 'send_unlimited',
        name: 'Unlimited Sending',
        description: 'Unlimited email sending',
        category: 'email',
        planLevel: 'enterprise',
      },
    }),
  ]);

  console.log('SaaS data seeded successfully!');
  console.log(`Created ${plans.length} plans`);
  console.log(`Created ${permissions.length} permissions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });