import { createAuthorizedSystem } from '../src/core/services/authorizedSystem.service';
import prisma from '../src/lib/prisma';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function promptQuestion(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function main() {
  try {
    console.log('=== Create New Authorized System ===\n');
    
    // Obtener información del sistema
    const name = await promptQuestion('Enter system name (Client ID): ');
    const description = await promptQuestion('Enter system description (optional): ');
    
    // Mostrar permisos disponibles
    const availablePermissions = await prisma.permission.findMany({
      select: { code: true, name: true, description: true }
    });
    
    console.log('\nAvailable permissions:');
    availablePermissions.forEach((permission, index) => {
      console.log(`${index + 1}. ${permission.code} - ${permission.name}: ${permission.description || 'No description'}`);
    });
    
    // Solicitar permisos
    const permissionsInput = await promptQuestion('\nEnter permission codes (comma separated): ');
    const permissionCodes = permissionsInput.split(',').map(code => code.trim());
    
    // Solicitar orígenes permitidos
    //dominios desde los cuales se permitirá hacer solicitudes a tu API
    const originsInput = await promptQuestion('Enter allowed origins (comma separated, leave empty for any): ');
    const allowedOrigins = originsInput ? originsInput.split(',').map(origin => origin.trim()) : [];
    
    // Crear el sistema autorizado
    const result = await createAuthorizedSystem(name, description || null, permissionCodes, allowedOrigins);
    
    console.log('\n=== System Created Successfully ===');
    console.log(`Client ID: ${result.system.name}`);
    console.log(`API Key: ${result.apiKey}`);
    console.log('\nIMPORTANT: Store this API Key securely. It will not be shown again.');
    console.log(`Permissions: ${result.system.permissions.join(', ')}`);
    
  } catch (error) {
    console.error('Error creating system:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Ejecutar el script
main();