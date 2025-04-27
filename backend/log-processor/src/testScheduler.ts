import { checkAndSendScheduledEmails } from './services/emailScheduler';
// import { PrismaClient } from '@prisma/client';
import prisma from './config/prismaConfig';
import { config } from 'dotenv';

// Load environment variables
config();

// const prisma = new PrismaClient();

async function testScheduler() {
  console.log('Testing email scheduler at', new Date().toLocaleString());
  
  // Show current settings
  const settings = await prisma.emailSetting.findUnique({
    where: { id: 1 }
  });
  
  if (!settings) {
    console.log('No email settings found. Please configure them first.');
    process.exit(1);
  }
  
  console.log('Current email settings:');
  console.log(`- Email: ${settings.email}`);
  console.log(`- Frequency: ${settings.reportFrequency}`);
  console.log(`- Time: ${settings.reportTime}`);
  console.log(`- Samples per module: ${settings.samplesPerModule}`);
  
  // Force override the time check
  console.log('Forcing email send regardless of schedule...');
  
  try {
    // Run the scheduler code
    await checkAndSendScheduledEmails(true);
    console.log('Scheduler check completed!');
  } catch (error) {
    console.error('Error running scheduler:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testScheduler().catch(console.error); 