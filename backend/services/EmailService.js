import nodemailer from 'nodemailer';

/**
 * EmailService - Abstraction for sending emails
 * This service provides a clean interface for sending emails that can be easily mocked for testing
 */
let transporter = null;

/**
 * Initialize the email transporter
 * Uses SMTP configuration from environment variables
 */
function initializeTransporter() {
  // Check if SMTP is configured
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('⚠️  SMTP credentials not configured. EmailService will not be able to send emails.');
    return;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Initialize transporter on module load
initializeTransporter();

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body (plain text)
 * @param {string} [options.html] - Email body (HTML, optional)
 * @returns {Promise<void>}
 * @throws {Error} If email cannot be sent
 */
async function send({ to, subject, body, html }) {
  if (!transporter) {
    throw new Error('Email service is not configured. Please set SMTP_USER and SMTP_PASS in your .env file');
  }

  if (!to || !subject || (!body && !html)) {
    throw new Error('Email must have to, subject, and body/html');
  }

  const message = {
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to,
    subject,
    text: body,
    html: html || body, // Use HTML if provided, otherwise use body as plain text
  };

  try {
    await transporter.sendMail(message);
    console.log(`✅ Email sent successfully to ${to}`);
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Check if email service is configured and ready
 * @returns {boolean}
 */
function isConfigured() {
  return transporter !== null;
}

// Export as default object with methods for easy mocking
const emailService = {
  send,
  isConfigured,
};

export default emailService;

