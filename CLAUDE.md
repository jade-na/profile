# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a portfolio/business card website for HEADBYTE, a Korean automation equipment software development company. The project combines static HTML pages with a Node.js backend for form processing and includes Firebase integration for data management.

## Architecture

### Frontend Structure
- **Main entry point**: `index.html` - Korean digital business card
- **Product landing pages**: Multiple HTML pages in dedicated directories
  - `HB-SECS Pro Landing/` - SECS/GEM software product pages (Korean, English)
  - `SemiSim Landing/` - SemiSim product landing pages
  - `Project Portfolio/` - Project showcase pages
- **Admin interface**: `admin/` directory with Firebase-powered dashboard for managing inquiries

### Backend Architecture
- **Server**: Express.js server (`server.js`) with SQLite database
- **Database**: SQLite database (`feedback.db`) for storing form submissions
- **Email**: Nodemailer integration with Outlook SMTP
- **Firebase**: Client-side Firebase integration for real-time admin dashboard

### Key Integrations
- **Dual form submission**: Forms submit to both backend SQLite and Firebase
- **Multi-language support**: Korean (default) and English versions of pages
- **Email notifications**: Automated email alerts for new inquiries

## Development Commands

### Server Operations
```bash
# Start production server
npm start

# Start development server with auto-reload
npm run dev
```

### Environment Setup
The project requires a `.env` file with:
- `EMAIL_USER` - Outlook email for SMTP
- `EMAIL_PASSWORD` - Outlook app password
- `DB_PATH` - SQLite database path (optional, defaults to 'feedback.db')

## Firebase Configuration

Firebase is configured in `js/firebase-config.js` with:
- **Project ID**: `headbyte-profile`
- **Collections**: `feedback` collection for storing form submissions
- **Admin access**: Through `admin/` pages with Firebase Authentication

## Form Processing Flow

1. User submits form on landing pages
2. Frontend JavaScript sends data to both:
   - Backend Express server (`/submit-feedback` endpoint)
   - Firebase Firestore (via client-side SDK)
3. Backend stores in SQLite and sends email notification
4. Firebase stores for real-time admin dashboard access

## File Structure Notes

- Static assets served directly from root
- Each product has its own subdirectory with images
- Admin pages use Bootstrap 5 for styling
- Main pages use Tailwind CSS (via CDN)
- No build process required - all dependencies loaded via CDN

## Testing

No automated tests are currently configured. Manual testing involves:
- Form submission testing on landing pages
- Admin dashboard functionality
- Email delivery verification
- Database storage confirmation