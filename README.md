# GameAble - Accessible Game Discovery Platform

GameAble is a full-stack web application designed to help gamers with disabilities find and enjoy accessible video games. Built with the MERN stack (MongoDB, Express.js, React, Node.js), the platform provides comprehensive filtering by accessibility features, detailed game information, user reviews, and social features.

## Overview

GameAble addresses a critical gap in the gaming industry by providing a centralized platform where users can discover games based on specific accessibility needs. The platform features advanced search and filtering capabilities, allowing users to find games that support features such as full captions, voice control, one-touch play, color-blind modes, and more.

### Key Features

- **Advanced Game Search & Filtering:** Filter games by genre, platform, and a comprehensive list of accessibility features
- **Detailed Game Pages:** View screenshots, trailers with captions, and verified accessibility information
- **User Authentication:** Secure registration and login with support for Google OAuth
- **Personalized Profiles:** Create profiles, add friends, and manage favorite games
- **Social Features:** Real-time chat system for communication between friends
- **Voice Command Navigation:** Hands-free navigation for users with dexterity impairments
- **Admin Dashboard:** Manage games, users, and game submission requests
- **Ratings & Reviews:** Community-driven accessibility feedback

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (version 20 or later) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **MongoDB Atlas Account** - [Sign up](https://www.mongodb.com/cloud/atlas/register) for a free account

## Installation

1. **Clone the repository:**

   ```bash
   git clone https://git.cardiff.ac.uk/c23015158/team_14_cm6311_project.git
   cd team_14_cm6311_project
   ```

2. **Install backend dependencies:**

   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**

   ```bash
   cd ../frontend
   npm install
   ```

## Starting the Server

### Development Mode

1. **Start the backend server:**

   ```bash
   cd backend
   npm run dev
   ```

   The backend API will be available at `http://localhost:5050`

2. **Start the frontend development server:**

   Open a new terminal window:

   ```bash
   cd frontend
   npm run dev
   ```

   The frontend will be available at `http://localhost:5173`

3. **Access the application:**

   Open your web browser and navigate to `http://localhost:5173`

### Production Build

To build the frontend for production:

```bash
cd frontend
npm run build
```

The production-ready files will be generated in the `frontend/dist` directory.

## Testing

The project includes comprehensive test suites for both frontend and backend.

### Backend Tests

Run all backend tests:

```bash
cd backend
npm test
```

Run tests once (for CI/CD):

```bash
npm run test:run
```

Generate coverage report:

```bash
npm run test:run -- --coverage
```

### Frontend Tests

Run all frontend tests:

```bash
cd frontend
npm test
```

Run tests once:

```bash
npm run test:run
```

Generate coverage report:

```bash
npm run test:run -- --coverage
```

### Continuous Integration

The project uses GitLab CI/CD to automatically run tests on every push. The pipeline configuration can be found in `.gitlab-ci.yml`.

## Project Structure

```
team_14_cm6311_project/
├── backend/                 # Backend API (Node.js + Express)
│   ├── config/             # Configuration files (database, passport)
│   ├── middleware/         # Express middleware (auth, upload)
│   ├── models/             # Mongoose models
│   ├── routes/             # API route handlers
│   ├── services/           # Business logic services
│   ├── tests/              # Backend test files
│   ├── utils/              # Utility functions
│   └── server.js           # Entry point
├── frontend/               # Frontend SPA (React + Vite)
│   ├── public/             # Static assets
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── context/        # React Context providers
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── test/           # Test utilities
│   │   └── utils/          # Utility functions
│   └── vite.config.js      # Vite configuration
└── .gitlab-ci.yml          # CI/CD pipeline configuration
```

## Additional Resources

For more detailed documentation, please visit the [project wiki](https://git.cardiff.ac.uk/c23015158/team_14_cm6311_project/-/wikis/home).

## License

This project is developed as part of the CM6311/6812 coursework at Cardiff University.
