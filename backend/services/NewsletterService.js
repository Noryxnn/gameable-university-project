import User from '../models/User.js';
import emailService from './EmailService.js';

/**
 * NewsletterService - Handles newsletter-related operations
 * This service manages sending newsletters to opted-in users
 */
class NewsletterService {
  /**
   * Generate a clean HTML email template for newsletters
   * @param {string} userName - User's name
   * @param {string} gameTitle - Game title
   * @param {string} gameLink - Link to the game detail page
   * @returns {string} HTML email template
   */
  generateNewsletterTemplate(userName, gameTitle, gameLink) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const profileUrl = `${frontendUrl}/profile`;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>New Game Added - GameAble</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f4; font-family: Arial, Helvetica, sans-serif;">
  <!-- Main Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <!-- Email Content Container -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); padding: 30px 20px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: bold; letter-spacing: 1px;">
                🎮 GameAble
              </h1>
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <!-- Greeting -->
              <p style="margin: 0 0 20px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Hi ${userName || 'there'},
              </p>
              
              <p style="margin: 0 0 25px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                We've just added a new game to our catalogue:
              </p>
              
              <!-- Game Title Highlight -->
              <div style="background-color: #f9fafb; border-left: 4px solid #9333ea; padding: 20px; margin: 25px 0; border-radius: 4px;">
                <p style="margin: 0; color: #9333ea; font-size: 24px; font-weight: bold; line-height: 1.4;">
                  🎮 ${gameTitle}
                </p>
              </div>
              
              <p style="margin: 0 0 30px 0; color: #333333; font-size: 16px; line-height: 1.6;">
                Click below to see more details:
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 30px 0;">
                    <a href="${gameLink}" style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #ec4899 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 6px; font-size: 16px; font-weight: bold; text-align: center; box-shadow: 0 4px 6px rgba(147, 51, 234, 0.3);">
                      Check It Out
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Thank You Message -->
              <p style="margin: 0; color: #666666; font-size: 15px; line-height: 1.6;">
                Thank you for being part of our community!
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; border-top: 1px solid #e5e7eb;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding: 0 0 15px 0;">
                    <p style="margin: 0; color: #9333ea; font-size: 18px; font-weight: bold;">
                      — GameAble Team
                    </p>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding: 0;">
                    <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                      If you no longer want to receive updates, you can 
                      <a href="${profileUrl}" style="color: #9333ea; text-decoration: underline;">turn off newsletters in your profile</a>.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }

  /**
   * Send a new game announcement to all users who have opted in to newsletters
   * @param {Object} game - The game object to announce
   * @param {string} game.title - Game title
   * @param {string} game._id - Game ID for generating link
   * @param {string} [game.description] - Game description (optional)
   * @returns {Promise<{sent: number, failed: number}>} - Number of emails sent and failed
   */
  async sendNewGameAnnouncement(game) {
    if (!game || !game.title) {
      throw new Error('Game object with title is required');
    }

    // Check if email service is configured
    if (!emailService.isConfigured()) {
      console.warn('⚠️  Email service is not configured. Newsletter emails will not be sent.');
      return { sent: 0, failed: 0 };
    }

    try {
      // Fetch all users who have opted in to newsletters
      const optedInUsers = await User.find({ 
        newsletterOptIn: true,
        email: { $exists: true, $ne: '' } // Ensure email exists and is not empty
      }).select('email username');

      if (optedInUsers.length === 0) {
        console.log('ℹ️  No users have opted in to newsletters. Skipping email send.');
        return { sent: 0, failed: 0 };
      }

      console.log(`📧 Sending newsletter to ${optedInUsers.length} users about: ${game.title}`);

      // Generate game link
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const gameLink = `${frontendUrl}/game/${game._id}`;

      let sent = 0;
      let failed = 0;

      // Send email to each opted-in user
      for (const user of optedInUsers) {
        try {
          const subject = `New game added: ${game.title}`;
          
          // Generate HTML email template
          const html = this.generateNewsletterTemplate(
            user.username || 'there',
            game.title,
            gameLink
          );
          
          // Plain text fallback
          const body = `Hi ${user.username || 'there'},

We've just added a new game to our catalogue:

🎮 ${game.title}

Click below to see more details:
${gameLink}

Thank you for being part of our community!

— GameAble Team

If you no longer want to receive updates, you can turn off newsletters in your profile: ${frontendUrl}/profile`;

          await emailService.send({
            to: user.email,
            subject,
            body,
            html,
          });

          sent++;
        } catch (error) {
          console.error(`❌ Failed to send newsletter email to ${user.email}:`, error.message);
          failed++;
        }
      }

      console.log(`✅ Newsletter sending complete: ${sent} sent, ${failed} failed`);
      return { sent, failed };
    } catch (error) {
      console.error('❌ Error in sendNewGameAnnouncement:', error);
      throw new Error(`Failed to send newsletter: ${error.message}`);
    }
  }

  /**
   * Get count of users who have opted in to newsletters
   * @returns {Promise<number>}
   */
  async getOptedInCount() {
    try {
      const count = await User.countDocuments({ newsletterOptIn: true });
      return count;
    } catch (error) {
      console.error('Error getting opted-in count:', error);
      throw error;
    }
  }
}

// Export singleton instance
const newsletterService = new NewsletterService();
export default newsletterService;

