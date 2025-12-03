Getting Started
This guide provides instructions on how to set up and run the GameAble project on your local machine for development and testing purposes.
Prerequisites
Before you begin, ensure you have the following software installed on your system:
•
Node.js (version 20 or later)
•
npm (usually comes with Node.js)
•
Git
•
MongoDB (or a MongoDB Atlas account)

Installation




Clone the repository:
Bash
git clone https://git.cardiff.ac.uk/c23015158/team_14_cm6311_project.git
cd team_14_cm6311_project




Install backend dependencies:
Bash
cd backend
npm install




Install frontend dependencies:
Bash
cd ../frontend
npm install

Running the Application




Start the backend server:
Bash
cd backend
npm run dev
The backend server will start on http://localhost:5050 by default.




Start the frontend development server:
Bash
cd frontend
npm run dev
The frontend development server will start on http://localhost:5173 by default. You can now access the
application in your web browser at this address.

Running Tests
To run the automated tests for the project, use the following commands:
•
Backend tests:
Bash
cd backend
npm test
•
Frontend tests:
Bash
cd frontend
npm test

---------------------------------------

Testing
Running Backend Tests
To run all backend tests, navigate to the backend directory and execute the following command:
Bash
cd backend
npm test
This command will run all tests in watch mode, which means the tests will automatically re-run when you make changes to the code.
To run the tests once (useful for CI/CD pipelines), use:
Bash
npm run test:run
Test Coverage
To generate a test coverage report, run:
Bash
npm run test:run -- --coverage
This will create a coverage report in the backend/coverage directory. You can open coverage/index.html in a browser to view a detailed, interactive coverage report.

Running Frontend Tests
To run all frontend tests, navigate to the frontend directory and execute:
Bash
cd frontend
npm test
This will run the tests in watch mode. To run the tests once, use:
Bash
npm run test:run
Test Coverage
To generate a test coverage report for the frontend:
Bash
npm run test:run -- --coverage
The coverage report will be generated in the frontend/coverage directory.

Continuous Integration
The project uses GitLab CI/CD to automatically run tests on every push to the repository. The CI/CD pipeline is configured in the .gitlab-ci.yml file and includes the following stages:
• Install: Install dependencies for both frontend and backend
• Lint: Run ESLint on the frontend code
• Test: Run automated tests for both frontend and backend
• Build: Build the frontend application for production
The test stage will fail if any tests fail, preventing broken code from being merged into the main branch.
