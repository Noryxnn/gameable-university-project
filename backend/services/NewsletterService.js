import User from '../models/User.js';
import emailService from './EmailService.js';

/**
 * NewsletterService - Handles newsletter-related operations
 * This service manages sending newsletters to opted-in users
 */
class NewsletterService {
  /**
   * Send a new game announcement to all users who have opted in to newsletters
   * @param {Object} game - The game object to announce
   * @param {string} game.title - Game title
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

      let sent = 0;
      let failed = 0;

      // Send email to each opted-in user
      for (const user of optedInUsers) {
        try {
          const subject = `New game added: ${game.title}`;
          const body = `We've just added ${game.title}. Check it out!`;
          
          // Optional: Add more details if description is available
          const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #9333ea;">New Game Added!</h2>
              <p>Hello ${user.username || 'there'},</p>
              <p>We've just added <strong>${game.title}</strong> to our collection!</p>
              ${game.description ? `<p>${game.description}</p>` : ''}
              <p>Check it out on our platform!</p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                You're receiving this email because you opted in to receive news and offers about new games.
              </p>
            </div>
          `;

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

