import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testEmailSending() {
  console.log("Email Test Script Starting...");
  console.log("----------------------------");
  
  // Check if email credentials are set
  if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
    console.error("ERROR: Missing email credentials in environment variables.");
    console.error("Please set EMAIL_USER and EMAIL_APP_PASSWORD in your .env file");
    process.exit(1);
  }

  // Print email configuration (without showing full password)
  console.log(`Email Configuration:
  - Email User: ${process.env.EMAIL_USER}
  - Password Set: ${process.env.EMAIL_APP_PASSWORD ? 'Yes' : 'No'} (${process.env.EMAIL_APP_PASSWORD?.length ?? 0} characters)
  `);

  // Create test email recipient from args or use default
  const recipient = process.argv[2] || process.env.EMAIL_USER;
  console.log(`Sending test email to: ${recipient}`);

  try {
    // Set up nodemailer transport
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // use SSL
      auth: {
        user: process.env.EMAIL_USER?.trim(),
        pass: process.env.EMAIL_APP_PASSWORD?.trim().replace(/\s+/g, '')
      },
      debug: true
    });

    console.log("Verifying SMTP connection...");
    
    // Verify connection
    await transporter.verify();
    console.log("✓ SMTP connection verified successfully");

    // Send test email
    console.log("Sending test email...");
    const info = await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: 'Test Email from Log Collector App',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #3b82f6;">Email Test Successful!</h2>
          <p>This is a test email from your Log Collector application.</p>
          <p>If you're seeing this, your email configuration is working correctly.</p>
          <div style="margin-top: 20px; padding: 15px; background-color: #f3f4f6; border-radius: 4px;">
            <p style="margin: 0; font-size: 14px;"><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p style="margin: 5px 0 0; font-size: 14px;"><strong>Environment:</strong> Test</p>
          </div>
        </div>
      `
    });

    console.log("✓ Email sent successfully!");
    console.log(`Message ID: ${info.messageId}`);
    console.log(`Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
  } catch (error) {
    console.error("❌ Error sending email:");
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testEmailSending().catch(console.error); 