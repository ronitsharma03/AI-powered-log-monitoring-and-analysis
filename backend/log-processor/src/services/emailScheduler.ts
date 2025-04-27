import { EmailSetting } from '@prisma/client';
import prisma from '../config/prismaConfig';
import { generateErrorReport } from './reportGenerator';
import nodemailer from 'nodemailer';
import { config } from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import cron from 'node-cron';

// Load environment variables
config();

// const prisma = new PrismaClient();

// Define reports directory
const reportsDir = path.join(__dirname, '../../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Keep track of active cron jobs
const scheduledJobs: { [key: string]: cron.ScheduledTask } = {};

// Keep track of the last time an email was sent for each frequency
// This prevents duplicate emails if the server restarts multiple times
interface LastSentRecord {
  timestamp: Date;
  frequency: string;
}
let lastSentEmails: LastSentRecord[] = [];

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

// Convert report frequency and time to a cron expression
function getCronExpression(frequency: string, time: string): string {
  // Parse the time
  const [hours, minutes] = time.split(':').map(Number);
  
  switch (frequency) {
    case 'hourly':
      return `${minutes} * * * *`; // Run at specified minutes every hour
    case 'daily':
      return `${minutes} ${hours} * * *`; // Run at specified time every day
    case 'weekly':
      return `${minutes} ${hours} * * 0`; // Run at specified time every Sunday
    case 'monthly':
      return `${minutes} ${hours} 1 * *`; // Run at specified time on the 1st of every month
    default:
      return `${minutes} ${hours} * * *`; // Default to daily
  }
}

// Check if email was recently sent to prevent duplicates
function wasRecentlySent(frequency: string): boolean {
  const now = new Date();
  const recentRecord = lastSentEmails.find(record => record.frequency === frequency);
  
  if (!recentRecord) return false;
  
  const timeDiffMs = now.getTime() - recentRecord.timestamp.getTime();
  
  // Define "recently" based on frequency
  switch (frequency) {
    case 'hourly':
      // Within the last 30 minutes
      return timeDiffMs < 30 * 60 * 1000;
    case 'daily':
      // Within the last 12 hours
      return timeDiffMs < 12 * 60 * 60 * 1000;
    case 'weekly':
      // Within the last 3 days
      return timeDiffMs < 3 * 24 * 60 * 60 * 1000;
    case 'monthly':
      // Within the last 10 days
      return timeDiffMs < 10 * 24 * 60 * 60 * 1000;
    default:
      // Default to 6 hours
      return timeDiffMs < 6 * 60 * 60 * 1000;
  }
}

// Record that an email was sent
function recordEmailSent(frequency: string): void {
  // Remove old record for this frequency if it exists
  lastSentEmails = lastSentEmails.filter(record => record.frequency !== frequency);
  
  // Add new record
  lastSentEmails.push({
    timestamp: new Date(),
    frequency
  });
  
  // Save to a file to persist across restarts
  try {
    const recordsPath = path.join(reportsDir, 'last_sent_records.json');
    fs.writeFileSync(recordsPath, JSON.stringify(lastSentEmails));
  } catch (err) {
    console.error('Failed to save email sent records:', err);
  }
}

// Load last sent records on startup
function loadLastSentRecords(): void {
  try {
    const recordsPath = path.join(reportsDir, 'last_sent_records.json');
    if (fs.existsSync(recordsPath)) {
      const data = fs.readFileSync(recordsPath, 'utf8');
      const records = JSON.parse(data);
      
      if (Array.isArray(records)) {
        lastSentEmails = records.map(record => ({
          ...record,
          timestamp: new Date(record.timestamp)
        }));
      }
    }
  } catch (err) {
    console.error('Failed to load email sent records:', err);
  }
}

// Check if it's time to send an email based on settings
async function shouldSendEmail(settings: any): Promise<boolean> {
  if (!settings) return false;
  
  // Return false if an email was recently sent for this frequency
  if (wasRecentlySent(settings.reportFrequency)) {
    console.log(`Skipping email check - ${settings.reportFrequency} report was recently sent`);
    return false;
  }
  
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  // Parse the scheduled time
  const [scheduledHour, scheduledMinute] = settings.reportTime.split(':').map(Number);
  
  // Time matches (within 5 minutes)
  const timeMatches = 
    (currentHour === scheduledHour && 
    currentMinute >= scheduledMinute && 
    currentMinute < scheduledMinute + 5) ||
    (currentHour === (scheduledHour + 1) % 24 &&
    scheduledMinute > 55 &&
    currentMinute < (scheduledMinute + 5) % 60);
  
  if (!timeMatches) return false;
  
  // Check frequency
  const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ...
  const currentDate = now.getDate();
  
  switch (settings.reportFrequency) {
    case 'hourly':
      // For hourly, just check if the minutes match
      return Math.abs(currentMinute - scheduledMinute) < 5;
    
    case 'daily':
      // If time matches, send it
      return timeMatches;
    
    case 'weekly':
      // If it's Sunday (0) and time matches, send it
      return currentDay === 0 && timeMatches;
    
    case 'monthly':
      // If it's the 1st of the month and time matches, send it
      return currentDate === 1 && timeMatches;
    
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
    
    // Skip if already sent recently (unless forcing a run)
    if (!forceRun && wasRecentlySent(settings.reportFrequency)) {
      console.log(`Skipping send - ${settings.reportFrequency} report was sent recently`);
      return;
    }
    
    const shouldSend = forceRun || await shouldSendEmail(settings);
    
    if (!shouldSend) {
      console.log('Not time to send yet based on settings');
      return;
    }
    
    console.log(`Time to send a ${settings.reportFrequency} report to ${settings.email}`);
    
    // Generate the report
    const report = await generateErrorReport(settings.samplesPerModule, settings.reportFrequency);
    
    // Save the report to the file system with a timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const reportFilename = `report_${settings.reportFrequency}_${timestamp}.html`;
    const reportPath = path.join(reportsDir, reportFilename);
    
    fs.writeFileSync(reportPath, report);
    console.log(`Report saved to ${reportPath}`);
    
    // Check if email credentials are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.error("Missing email credentials in environment variables");
      return;
    }
    
    // Create transporter and verify connection
    const transporter = createTransporter();
    await transporter.verify();
    
    // Send the email with the report attached
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: settings.email,
      subject: `Scheduled Error Report (${settings.reportFrequency}) - ${new Date().toLocaleDateString()}`,
      html: report,
      attachments: [
        {
          filename: reportFilename,
          content: report,
          contentType: 'text/html'
        }
      ]
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Scheduled report sent successfully:', info.messageId);
    
    // Record that we sent an email
    recordEmailSent(settings.reportFrequency);
    
    // Log to database that we sent a report
    console.log('Email sent at:', new Date().toLocaleString());
    
  } catch (error) {
    console.error('Error in scheduled email check:', error);
  }
}

// Maintain a reference to the interval to prevent duplicate schedulers
let schedulerInterval: NodeJS.Timeout | null = null;
let watchdogInterval: NodeJS.Timeout | null = null;

// Reschedule email job based on updated settings
export function rescheduleEmailJob(settings: EmailSetting): boolean {
  try {
    // Cancel any existing jobs
    const jobId = 'emailReport';
    if (scheduledJobs[jobId]) {
      console.log(`Stopping existing email scheduler job: ${jobId}`);
      scheduledJobs[jobId].stop();
      delete scheduledJobs[jobId];
    }
    
    // Also clear any interval-based scheduler
    if (schedulerInterval) {
      console.log('Clearing existing interval-based scheduler');
      clearInterval(schedulerInterval);
      schedulerInterval = null;
    }
    
    // Validate settings
    if (!settings || !settings.email || !settings.reportFrequency || !settings.reportTime) {
      console.log('Invalid settings for scheduling, skipping job creation');
      return false;
    }
    
    // Create a new cron expression based on settings
    const cronExpression = getCronExpression(settings.reportFrequency, settings.reportTime);
    console.log(`Setting up new email schedule with cron: ${cronExpression} (${settings.reportFrequency} at ${settings.reportTime})`);
    
    // Validate cron expression
    if (!cron.validate(cronExpression)) {
      console.error(`Invalid cron expression: ${cronExpression}`);
      return false;
    }
    
    // Schedule the new job using both cron and watchdog interval
    try {
      // Set up cron job (main scheduler)
      const job = cron.schedule(cronExpression, () => {
        console.log(`Running scheduled email job at ${new Date().toLocaleString()}`);
        checkAndSendScheduledEmails()
          .catch(err => console.error('Error in scheduled email job:', err));
      });
      
      scheduledJobs[jobId] = job;
      console.log(`Successfully scheduled email job with ID: ${jobId}, cron: ${cronExpression}`);
      
      // Set up a watchdog that checks more frequently 
      // This ensures we don't miss scheduled times even if cron fails
      if (!watchdogInterval) {
        watchdogInterval = setInterval(() => {
          console.log(`Running watchdog email check at ${new Date().toLocaleString()}`);
          checkAndSendScheduledEmails()
            .catch(err => console.error('Error in watchdog check:', err));
        }, 1 * 60 * 1000); // Check every minute to be extra safe
      }
      
      // Run a check immediately
      console.log('Running initial check after rescheduling');
      checkAndSendScheduledEmails(false)
        .catch(err => console.error('Error in initial check after rescheduling:', err));
      
      return true;
    } catch (error) {
      console.error('Error scheduling cron job:', error);
      return false;
    }
  } catch (error) {
    console.error('Error in rescheduleEmailJob:', error);
    return false;
  }
}

// Function to start the scheduler
export function startEmailScheduler(checkIntervalMinutes = 1): boolean {
  console.log(`Starting email scheduler at ${new Date().toLocaleString()}`);
  
  // Load previous email sent records
  loadLastSentRecords();
  
  // Clear any existing intervals
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    console.log('Cleared existing scheduler interval');
  }
  
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    console.log('Cleared existing watchdog interval');
  }
  
  // Set up the persistent watchdog right away
  watchdogInterval = setInterval(() => {
    console.log(`Running watchdog email check at ${new Date().toLocaleString()}`);
    checkAndSendScheduledEmails()
      .catch(err => console.error('Error in watchdog check:', err));
  }, 1 * 60 * 1000); // Check every minute
  
  // Get settings and set up cron job
  prisma.emailSetting.findUnique({ where: { id: 1 } })
    .then(settings => {
      if (settings) {
        console.log('Found email settings, setting up cron job');
        rescheduleEmailJob(settings);
      } else {
        console.log('No email settings found, will use interval-based checking');
        
        // Run the first check immediately
        checkAndSendScheduledEmails()
          .then(() => console.log('Initial scheduler check completed'))
          .catch(err => console.error('Error in initial scheduler check:', err));
        
        // Set up interval for future checks as a fallback
        schedulerInterval = setInterval(() => {
          console.log(`Running interval check at ${new Date().toLocaleString()}`);
          checkAndSendScheduledEmails()
            .catch(err => console.error('Error in scheduler interval:', err));
        }, checkIntervalMinutes * 60 * 1000);
        
        console.log(`Set up interval-based checking every ${checkIntervalMinutes} minutes`);
      }
    })
    .catch(err => {
      console.error('Error getting email settings:', err);
      
      // Fallback to interval-based checking
      console.log('Using interval-based checking as fallback');
      schedulerInterval = setInterval(() => {
        checkAndSendScheduledEmails()
          .catch(err => console.error('Error in scheduler interval:', err));
      }, checkIntervalMinutes * 60 * 1000);
    });
  
  // Return true to indicate the scheduler was started
  return true;
} 