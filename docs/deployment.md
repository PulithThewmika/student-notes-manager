# Deployment Guide

This project is fully integrated with GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD) to Microsoft Azure.

## CI/CD Workflows

Both frontend and backend are deployed automatically whenever code is pushed (or a pull request is merged) to the `main` branch.

### 1. Backend Workflow (`main_student-notes-api-pulith.yml`)
- Tracks changes in the `.NET back-end Web API/` directory.
- Sets up .NET 9 SDK.
- Runs `dotnet build` and `dotnet publish`.
- Authenticates with Azure using OIDC (OpenID Connect).
- Deploys the artifacts to Azure App Service (`azure/webapps-deploy@v3`).

**Required Secrets:**
- `AZURE_CLIENT_ID`
- `AZURE_TENANT_ID`
- `AZURE_SUBSCRIPTION_ID`

### 2. Frontend Workflow (`azure-static-web-apps-....yml`)
- Tracks changes in the `React.js front-end/` directory.
- Runs `npm install` and `npm run build` using the Node.js runner.
- Injects `VITE_AZURE_BACKEND` into the environment during build time so React compiles with the correct production API URL.
- Bypasses Oryx's built-in build step (`skip_app_build: true`) and uploads the compiled `dist/` folder directly to Azure Static Web Apps.

**Required Secrets:**
- `AZURE_STATIC_WEB_APPS_API_TOKEN_...` (Generated automatically by Azure).
- `AZURE_BACKEND` (Must be manually added by you, pointing to your live API Endpoint, e.g., `https://myapp.azurewebsites.net/api/notes`).

## How to Rollback/Redeploy
If a deployment fails or you need to re-run it:
1. Navigate to the **Actions** tab in GitHub.
2. Select the workflow that failed (e.g., "Build and deploy ASP.Net Core app...").
3. Click "Re-run jobs" in the top right corner.