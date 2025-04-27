import { Router, Request, Response } from "express";
import prisma from "../config/prismaConfig";
import nodemailer from "nodemailer";
import { generateErrorReport } from "../services/reportGenerator";
import { config } from "dotenv"
import { checkAndSendScheduledEmails, startEmailScheduler, rescheduleEmailJob } from "../services/emailScheduler";
import * as fs from 'fs';
import * as path from 'path';

config();

const router = Router();

// Create reports directory if it doesn't exist
const reportsDir = path.join(__dirname, '../../reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

// Email settings schema in the database
interface EmailSettings {
  email: string;
  reportFrequency: string; // daily, weekly, monthly
  reportTime: string; // HH:MM format
  samplesPerModule: number;
}

// Save email settings
router.post("/settings", async (req: Request, res: Response) => {
  try {
    const { email, reportFrequency, reportTime, samplesPerModule } = req.body;
    
    // Validate input
    if (!email || !reportFrequency || !reportTime) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields"
      });
    }
    
    // Upsert the settings (update if exists, create if not)
    const settings = await prisma.emailSetting.upsert({
      where: { id: 1 },
      update: {
        email,
        reportFrequency,
        reportTime,
        samplesPerModule: samplesPerModule || 3
      },
      create: {
        id: 1, // We'll always use id 1 since we only need one record
        email,
        reportFrequency,
        reportTime,
        samplesPerModule: samplesPerModule || 3
      }
    });
    
    // Reschedule the email job with the new settings
    console.log("Settings updated, rescheduling email job...");
    const rescheduled = rescheduleEmailJob(settings);
    console.log(`Email job ${rescheduled ? 'successfully' : 'failed to be'} rescheduled`);
    
    return res.json({
      success: true,
      message: "Email settings saved successfully"
    });
  } catch (error) {
    console.error("Error saving email settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save email settings"
    });
  }
});

// Get email settings
router.get("/settings", async (req: Request, res: Response) => {
  try {
    const settings = await prisma.emailSetting.findUnique({
      where: { id: 1 }
    });
    
    return res.json({
      success: true,
      settings: settings || {
        email: "",
        reportFrequency: "daily",
        reportTime: "09:00",
        samplesPerModule: 3
      }
    });
  } catch (error) {
    console.error("Error fetching email settings:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch email settings"
    });
  }
});

// Get available saved reports
router.get("/reports", async (req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(reportsDir);
    const reports = files
      .filter(file => file.endsWith('.html'))
      .map(file => {
        const stats = fs.statSync(path.join(reportsDir, file));
        return {
          filename: file,
          date: stats.mtime,
          size: stats.size
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first
    
    return res.json({
      success: true,
      reports
    });
  } catch (error) {
    console.error("Error getting reports list:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get reports list"
    });
  }
});

// Download a specific report
router.get("/reports/:filename", async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(reportsDir, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Report not found"
      });
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    console.error("Error downloading report:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to download report"
    });
  }
});

// Generate and send a report manually
router.post("/generate-report", async (req: Request, res: Response) => {
  try {
    console.log("Report generation request received", req.body);
    const { samplesPerModule = 3, testOnly = false, reportFrequency } = req.body;
    
    // Get the email settings
    let settings = await prisma.emailSetting.findUnique({
      where: { id: 1 }
    });
    
    console.log("Email settings found:", settings);
    
    // If no settings exist and this is not just a test
    if (!settings && !testOnly) {
      return res.status(400).json({
        success: false,
        message: "No email settings found. Please configure email settings first."
      });
    }
    
    // Use provided frequency or the one from settings
    const frequency = reportFrequency || settings?.reportFrequency || 'daily';
    
    try {
      // Generate the report
      console.log(`Generating ${frequency} report with ${samplesPerModule} samples per module`);
      const report = await generateErrorReport(samplesPerModule, frequency);
      console.log("Report generated successfully, length:", report.length);
      
      // Save the report to the reports directory with timestamp
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const reportFilename = `report_${frequency}_${timestamp}.html`;
      const reportPath = path.join(reportsDir, reportFilename);
      
      fs.writeFileSync(reportPath, report);
      console.log(`Report saved to ${reportPath}`);
      
      // If this is just a test or we're not sending an email
      if (testOnly) {
        return res.json({
          success: true,
          message: "Report generated successfully (test mode - no email sent)",
          report: report,
          reportFilename: reportFilename
        });
      }
      
      // Make sure we have email settings
      if (!settings || !settings.email) {
        return res.status(400).json({
          success: false,
          message: "Invalid email settings. Please configure a valid email address.",
          report: report,
          reportFilename: reportFilename
        });
      }
      
      // Check email environment variables
      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        console.error("Missing email credentials in environment variables");
        return res.status(500).json({
          success: false,
          message: "Server email configuration is incomplete. Please contact administrator.",
          report: report,
          reportFilename: reportFilename
        });
      }
      
      // Debugging email configuration
      console.log("Email configuration:", {
        user: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 3) + "..." : "Not set",
        password: process.env.EMAIL_APP_PASSWORD ? "Password is set (length: " + process.env.EMAIL_APP_PASSWORD.length + ")" : "Not set",
        recipient: settings.email
      });
      
      // Make sure passwords don't have any extra spaces (a common issue with app passwords)
      const emailUser = process.env.EMAIL_USER?.trim();
      const emailPassword = process.env.EMAIL_APP_PASSWORD?.trim().replace(/\s+/g, '');
      
      if (!emailUser || !emailPassword) {
        console.error("Email credentials are missing or empty after trimming spaces");
        return res.status(500).json({
          success: false,
          message: "Invalid email configuration on server. Please contact administrator.",
          report: report,
          reportFilename: reportFilename
        });
      }
      
      console.log(`Using auth: user=${emailUser}, password length=${emailPassword.length}`);
      
      // Set up nodemailer with Gmail
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
          user: emailUser, // Use the trimmed variable
          pass: emailPassword // Use the trimmed variable
        },
        debug: true
      });
      
      // Verify SMTP connection configuration
      console.log("Verifying SMTP connection");
      try {
        await transporter.verify();
        console.log("SMTP connection verified successfully");
      } catch (smtpError: any) {
        console.error("SMTP verification failed:", smtpError);
        return res.status(500).json({
          success: false,
          message: "Email server connection failed. Please check your credentials.",
          error: smtpError.message,
          report: report,
          reportFilename: reportFilename
        });
      }
      
      // Email message configuration
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: settings.email,
        subject: `Error Log Report (${frequency}) - ${new Date().toLocaleDateString()}`,
        html: report,
        attachments: [
          {
            filename: reportFilename,
            content: report,
            contentType: 'text/html'
          }
        ]
      };
      
      console.log("Sending email to", settings.email);
      
      // Send the email
      try {
        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent successfully:", info.messageId);
        
        return res.json({
          success: true,
          message: "Report generated and sent successfully",
          report: report,
          reportFilename: reportFilename
        });
      } catch (emailError: any) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({
          success: false,
          message: `Email sending failed: ${emailError.message}`,
          report: report,
          reportFilename: reportFilename
        });
      }
    } catch (reportError: any) {
      console.error("Error in report generation/email sending:", reportError);
      // Still return the report in test mode even if email sending fails
      if (testOnly) {
        return res.json({
          success: true,
          message: "Report generated but email sending failed: " + reportError.message,
          report: reportError.report || "Error generating report"
        });
      } else {
        throw reportError; // Re-throw for the outer catch block
      }
    }
  } catch (error: unknown) {
    console.error("Error in generate-report endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const stack = error instanceof Error ? error.stack : "No stack trace";
    console.error("Stack trace:", stack);
    
    return res.status(500).json({
      success: false,
      message: "Failed to generate or send report",
      error: errorMessage,
      details: error
    });
  }
});

// Test endpoint for checking scheduled emails
router.post("/test-scheduler", async (req: Request, res: Response) => {
  try {
    // Force run the scheduler check
    await checkAndSendScheduledEmails(true); // Force run regardless of schedule
    
    return res.json({
      success: true,
      message: "Scheduler check triggered successfully"
    });
  } catch (error: any) {
    console.error("Error testing scheduler:", error);
    
    return res.status(500).json({
      success: false,
      message: "Error testing scheduler",
      error: error.message
    });
  }
});

export default router; 