import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Definir permisos básicos
  const permissions = [
    {
      code: 'send_direct',
      name: 'Send Direct Email',
      description: 'Allows sending emails with direct content'
    },
    {
      code: 'send_template',
      name: 'Send Template Email',
      description: 'Allows sending emails using templates'
    },
    {
      code: 'manage_templates',
      name: 'Manage Templates',
      description: 'Allows creating, updating and deleting email templates'
    },
    {
      code: 'view_logs',
      name: 'View Logs',
      description: 'Allows viewing email sending logs'
    },
    {
      code: 'admin',
      name: 'Administrator',
      description: 'Full administrative access'
    }
  ];

  console.log('Seeding permissions...');
  
  // Crear permisos
  for (const permission of permissions) {
    await prisma.permission.upsert({
      where: { code: permission.code },
      update: permission,
      create: permission
    });
  }

  console.log('Seeding completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });