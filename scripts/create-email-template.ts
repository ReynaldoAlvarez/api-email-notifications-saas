import { PrismaClient } from '@prisma/client';
import readline from 'readline';

const prisma = new PrismaClient();

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
    console.log('=== Create New Email Template ===\n');
    
    // Obtener información de la plantilla
    const name = await promptQuestion('Enter template name: ');
    const subject = await promptQuestion('Enter template subject: ');
    
    console.log('\nEnter HTML content (end with a line containing only "END"):');
    let contentHtml = '';
    let line = '';
    while (true) {
      line = await promptQuestion('');
      if (line === 'END') break;
      contentHtml += line + '\n';
    }
    
    console.log('\nEnter plain text content (optional, end with a line containing only "END"):');
    let contentText = '';
    while (true) {
      line = await promptQuestion('');
      if (line === 'END') break;
      contentText += line + '\n';
    }
    
    const variablesInput = await promptQuestion('\nEnter variable names (comma separated): ');
    const variables = variablesInput.split(',').map(v => v.trim());
    
    // Crear la plantilla en la base de datos
    const template = await prisma.emailTemplate.create({
      data: {
        name,
        subject,
        contentHtml,
        contentText: contentText || undefined,
        variables,
        isActive: true
      }
    });
    
    console.log('\n=== Template Created Successfully ===');
    console.log(`ID: ${template.id}`);
    console.log(`Name: ${template.name}`);
    console.log(`Subject: ${template.subject}`);
    console.log(`Variables: ${template.variables.join(', ')}`);
    
  } catch (error) {
    console.error('Error creating template:', error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Ejecutar el script
main();