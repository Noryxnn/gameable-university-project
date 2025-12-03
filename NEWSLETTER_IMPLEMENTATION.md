# Newsletter Feature Implementation

## Overview
This document describes the complete implementation of the newsletter opt-in feature for the GameAble platform.

## Implementation Summary

### ✅ Completed Features

#### 1. User Model Updates
- Added `newsletterOptIn` field (Boolean, default: false)
- Added `newsletterOptInUpdatedAt` field (Date, optional)
- Fields are included in the User schema and persist to the database

#### 2. Registration Flow
- **Frontend**: Added checkbox labeled "Receive news and offers about new games" in `Register.jsx`
- **Backend**: Updated `/api/users/register` endpoint to accept and store `newsletterOptIn`
- Defaults to `false` if not provided
- Sets `newsletterOptInUpdatedAt` when user opts in

#### 3. Google OAuth Signup
- New Google OAuth users automatically get `newsletterOptIn = false`
- `newsletterOptInUpdatedAt` is set to `null` for new Google users
- Existing Google users keep their current preference unchanged

#### 4. Profile Page Toggle
- **Frontend**: Added newsletter checkbox in `Profile.jsx` under the Bio section
- Checkbox is bound to `newsletterOptIn` state
- Only editable when in edit mode
- **Backend**: Created `PUT /api/users/me/preferences` endpoint
- Validates that `newsletterOptIn` is a boolean
- Updates both `newsletterOptIn` and `newsletterOptInUpdatedAt`
- Requires authentication (user can only update their own preference)

#### 5. Admin Game Creation → Newsletter Sending
- **Backend**: Updated `POST /api/games` endpoint
- After game is successfully created, triggers `NewsletterService.sendNewGameAnnouncement()`
- Newsletter sending is non-blocking (fire and forget) to avoid delaying the API response
- Only sends to users where `newsletterOptIn = true`

#### 6. Service Layer Architecture

**EmailService** (`backend/services/EmailService.js`):
- Abstracted email sending service
- Uses nodemailer with SMTP configuration from environment variables
- Provides `send()` method with clean interface
- Can be easily mocked for testing
- Checks if SMTP is configured before attempting to send

**NewsletterService** (`backend/services/NewsletterService.js`):
- Handles newsletter-related operations
- `sendNewGameAnnouncement(game)`: Sends emails to all opted-in users
- Email subject: "New game added: {GameTitle}"
- Email body: "We've just added {GameTitle}. Check it out!"
- Returns count of sent/failed emails
- Handles errors gracefully (continues sending even if some fail)

### 7. Testing

Comprehensive test suite includes:

**Unit Tests:**
- `backend/tests/services/NewsletterService.test.js`: Tests for NewsletterService
  - Sends to opted-in users only
  - Handles email failures gracefully
  - Includes game title in subject
  - Returns correct sent/failed counts

**Integration Tests:**
- `backend/tests/routes/newsletter.test.js`: End-to-end tests
  - Registration with opt-in/opt-out
  - Preferences endpoint updates
  - Admin game creation triggering newsletter
  - Validation and error handling

**Model Tests:**
- `backend/tests/models/User.test.js`: User model newsletter fields
- `backend/tests/config/passport-newsletter.test.js`: Google OAuth default behavior

## File Changes

### Backend Files Modified:
1. `backend/models/User.js` - Added newsletter fields
2. `backend/routes/auth.js` - Registration and preferences endpoints
3. `backend/routes/games.js` - Game creation triggers newsletter
4. `backend/config/passport.js` - Google OAuth defaults

### Backend Files Created:
1. `backend/services/EmailService.js` - Email abstraction layer
2. `backend/services/NewsletterService.js` - Newsletter business logic
3. `backend/tests/services/NewsletterService.test.js` - Service tests
4. `backend/tests/routes/newsletter.test.js` - Integration tests
5. `backend/tests/config/passport-newsletter.test.js` - OAuth tests

### Frontend Files Modified:
1. `frontend/src/pages/Register.jsx` - Added newsletter checkbox
2. `frontend/src/pages/Profile.jsx` - Added newsletter toggle

## API Endpoints

### New Endpoints:
- `PUT /api/users/me/preferences`
  - Body: `{ newsletterOptIn: boolean }`
  - Requires authentication
  - Returns: `{ message, newsletterOptIn, newsletterOptInUpdatedAt }`

### Modified Endpoints:
- `POST /api/users/register`
  - Now accepts optional `newsletterOptIn` field
  - Defaults to `false` if not provided

- `POST /api/games` (admin only)
  - Now triggers newsletter sending after game creation
  - Newsletter sending is non-blocking

## Environment Variables Required

For email functionality:
- `SMTP_HOST` (default: smtp.gmail.com)
- `SMTP_PORT` (default: 587)
- `SMTP_USER` - SMTP username
- `SMTP_PASS` - SMTP password
- `SMTP_FROM` (optional, defaults to SMTP_USER)

## Assumptions Made

1. **Email Service**: Assumes SMTP configuration is available. If not configured, the service logs a warning and returns gracefully without sending emails.

2. **Newsletter Sending**: Newsletter sending is non-blocking (fire and forget) to ensure game creation API response is not delayed. Errors are logged but don't affect the game creation response.

3. **Default Behavior**: 
   - New users default to `newsletterOptIn = false` (opt-out by default)
   - Google OAuth users explicitly default to `false` and must opt-in later

4. **User Experience**: 
   - Newsletter preference can be changed at any time from the profile page
   - The checkbox is only editable when the profile is in edit mode

5. **Email Content**: 
   - Simple email template with game title
   - HTML version includes game description if available
   - Plain text fallback for email clients that don't support HTML

6. **Testing**: 
   - EmailService is mocked in tests to avoid sending actual emails
   - Tests use test database or clean up test data after execution

## Usage Examples

### Registration with Newsletter Opt-In
```javascript
POST /api/users/register
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "newsletterOptIn": true
}
```

### Update Newsletter Preference
```javascript
PUT /api/users/me/preferences
Headers: { Authorization: "Bearer <token>" }
{
  "newsletterOptIn": true
}
```

### Admin Creates Game (triggers newsletter automatically)
```javascript
POST /api/games
Headers: { Authorization: "Bearer <admin-token>" }
{
  "title": "New Game",
  "developer": "Developer Name",
  "genre": "Action",
  "description": "Game description",
  "releaseYear": 2024,
  "imageUrl": "https://example.com/image.jpg",
  "rating": "E"
}
```

## Testing

Run tests with:
```bash
npm test
```

Test coverage includes:
- Unit tests for NewsletterService
- Integration tests for API endpoints
- Model tests for User newsletter fields
- Google OAuth default behavior tests

## Future Enhancements (Optional)

1. Email templates with richer HTML formatting
2. Unsubscribe link in emails
3. Newsletter preferences page with more options
4. Batch email sending with rate limiting
5. Email delivery tracking and analytics
6. Scheduled newsletter campaigns
7. A/B testing for email content

