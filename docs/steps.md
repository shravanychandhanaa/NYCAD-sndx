Task Report: CI Pipeline Setup

Objective



To set up a Continuous Integration (CI) workflow for the project that automates the installation of dependencies, linting, building, and testing processes for both frontend and backend services.



Actions Taken



Repository Setup



Forked the main repository into the personal GitHub account to work independently.



Cloned the repository locally and reviewed the project structure.



Identified Dependency Files



Frontend: package.json (Node.js project).



Backend: package.json (Node.js project).



Created CI Workflow



Added a new workflow file at .github/workflows/ci.yml.



Configured the workflow to run on push and pull\_request events for the branch feat/ci-cd-bootstrap.



Pipeline Steps Implemented



Checkout Code: Used actions/checkout@v4 to fetch repository code.



Setup Node.js: Configured Node.js environment using actions/setup-node@v4 with version 18.x.



Frontend Build Process:



Installed dependencies (npm install).



Ran linting (npm run lint).



Built frontend (npm run build).



Backend Build Process:



Installed dependencies (npm install).



Ran linting (npm run lint).



Executed tests (npm test).



Outcome



The GitHub Actions workflow executed successfully.



Both frontend and backend dependencies were installed, lint checks passed, builds were created, and backend tests were executed.



The pipeline is now ready to automatically validate code changes upon commits and pull requests.

