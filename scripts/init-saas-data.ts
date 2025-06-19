import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Inicializando datos SaaS...');

  // Crear planes si no existen
  const plans = [
    {
      id: 'plan-free',
      name: 'Free',
      slug: 'free',
      description: 'Perfecto para probar y proyectos pequeños',
      price: 0.00,
      emailsPerMonth: 100,
      templatesLimit: 5,
      apiCallsPerMinute: 10,
      features: ['Envío básico de correos', '5 plantillas', 'Logs de correos'],
    },
    {
      id: 'plan-basic',
      name: 'Basic',
      slug: 'basic',
      description: 'Ideal para pequeñas empresas',
      price: 29.00,
      emailsPerMonth: 1000,
      templatesLimit: 25,
      apiCallsPerMinute: 60,
      features: ['1,000 correos/mes', '25 plantillas', 'Analytics básicos', 'Soporte prioritario'],
    },
    {
      id: 'plan-pro',
      name: 'Pro',
      slug: 'pro',
      description: 'Perfecto para empresas en crecimiento',
      price: 99.00,
      emailsPerMonth: 10000,
      templatesLimit: 100,
      apiCallsPerMinute: 120,
      features: ['10,000 correos/mes', '100 plantillas', 'Analytics avanzados', 'Eventos webhook', 'Soporte prioritario'],
    },
    {
      id: 'plan-enterprise',
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Para organizaciones grandes',
      price: 299.00,
      emailsPerMonth: 100000,
      templatesLimit: null,
      apiCallsPerMinute: 300,
      features: ['100,000 correos/mes', 'Plantillas ilimitadas', 'Analytics avanzados', 'Eventos webhook', 'Soporte dedicado', 'Garantía SLA'],
    },
  ];

  for (const planData of plans) {
    await prisma.plan.upsert({
      where: { slug: planData.slug },
      update: {},
      create: planData,
    });
  }

  // Crear permisos por plan
  const permissions = [
    // Permisos básicos (Free plan)
    { code: 'send_basic', name: 'Envío Básico', description: 'Enviar correos hasta el límite del plan', category: 'email', planLevel: 'free' },
    { code: 'templates_basic', name: 'Plantillas Básicas', description: 'Crear y usar plantillas básicas', category: 'template', planLevel: 'free' },
    { code: 'logs_basic', name: 'Logs Básicos', description: 'Ver logs de correos', category: 'logs', planLevel: 'free' },
    
    // Permisos estándar (Basic plan)
    { code: 'send_standard', name: 'Envío Estándar', description: 'Enviar correos con características estándar', category: 'email', planLevel: 'basic' },
    { code: 'analytics_basic', name: 'Analytics Básicos', description: 'Ver analytics básicos de correos', category: 'analytics', planLevel: 'basic' },
    
    // Permisos avanzados (Pro plan)
    { code: 'send_advanced', name: 'Envío Avanzado', description: 'Enviar correos con características avanzadas', category: 'email', planLevel: 'pro' },
    { code: 'webhooks', name: 'Eventos Webhook', description: 'Recibir notificaciones webhook', category: 'webhooks', planLevel: 'pro' },
    
    // Permisos enterprise
    { code: 'send_unlimited', name: 'Envío Ilimitado', description: 'Envío ilimitado de correos', category: 'email', planLevel: 'enterprise' },
  ];

  for (const permissionData of permissions) {
    await prisma.permission.upsert({
      where: { code: permissionData.code },
      update: {},
      create: permissionData,
    });
  }

  console.log('✅ Datos SaaS inicializados correctamente');
  console.log(`📦 Creados ${plans.length} planes`);
  console.log(`🔐 Creados ${permissions.length} permisos`);
}

main()
  .catch((e) => {
    console.error('❌ Error inicializando datos SaaS:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });