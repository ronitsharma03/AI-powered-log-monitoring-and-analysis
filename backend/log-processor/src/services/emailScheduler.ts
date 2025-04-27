import { PrismaClient } from '@prisma/client';
import { generateErrorReport } from './reportGenerator';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';

// Load environment variables
config();

const prisma = new PrismaClient();

// Set up nodemailer transport
function createTransporter() {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER?.trim(),
      pass: process.env.EMAIL_APP_PASSWORD?.trim().replace(/\s+/g, '')
    }
  });
}

// Check if it's time to send an email based on settings
async function shouldSendEmail(settings: any): Promise<boolean> {
  if (!settings) return false;
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Parse the scheduled time
  const [scheduledHour, scheduledMinute] = settings.reportTime.split(':').map(Number);
  
  // Time matches (within 5 minutes)
  const timeMatches = 
    currentHour === scheduledHour && 
    Math.abs(currentMinute - scheduledMinute) < 5;
  
  if (!timeMatches) return false;
  
  // Check frequency
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  
  switch (settings.reportFrequency) {
    case 'hourly':
      // For hourly, just check if it's near the top of the hour
      return currentMinute < 5;
    
    case 'daily':
      // If time matches, send it
      return timeMatches;
    
    case 'weekly':
      // If it's Sunday (0) and time matches, send it
      return currentDay === 0 && timeMatches;
    
    case 'monthly':
      // If it's the 1st of the month and time matches, send it
      return now.getDate() === 1 && timeMatches;
    
    default:
      return false;
  }
}

// Main function to check and send scheduled emails
export async function checkAndSendScheduledEmails(forceRun = false) {
  try {
    console.log('Checking scheduled emails at', new Date().toLocaleString());
    
    // Get the email settings
    const settings = await prisma.emailSetting.findUnique({
      where: { id: 1 }
    });
    
    if (!settings || !settings.email) {
      console.log('No email settings found or email address not set');
      return;
    }
    
    const shouldSend = forceRun || await shouldSendEmail(settings);
    
    if (!shouldSend) {
      console.log('Not time to send yet based on settings');
      return;
    }
    
    console.log(`Time to send a ${settings.reportFrequency} report to ${settings.email}`);
    
    // Generate the report
    const report = await generateErrorReport(settings.samplesPerModule);
    
    // Create transporter and verify connection
    const transporter = createTransporter();
    await transporter.verify();
    
    // Send the email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: settings.email,
      subject: `Scheduled Error Report - ${new Date().toLocaleDateString()}`,
      html: report
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Scheduled report sent successfully:', info.messageId);
    
    // Log to database that we sent a report
    console.log('Email sent at:', new Date().toLocaleString());
    
  } catch (error) {
    console.error('Error in scheduled email check:', error);
  }
}

// Function to start the scheduler
export function startEmailScheduler(checkIntervalMinutes = 1) {
  console.log(`Starting email scheduler with ${checkIntervalMinutes} minute interval`);
  
  // Run the first check immediately
  checkAndSendScheduledEmails().catch(console.error);
  
  // Set up interval for future checks
  setInterval(() => {
    checkAndSendScheduledEmails().catch(console.error);
  }, checkIntervalMinutes * 60 * 1000);
} 