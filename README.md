<p align="center"> <img src="https://github.com/user-attachments/assets/eeda1544-7710-4e8e-b729-995899e1cde0" alt="Nova Notes Hero" width="300"/> </p>




# NOVA NOTES Notes Manager

A full-stack web application demonstrating the deployment of a React front-end and a .NET Web API back-end to Microsoft Azure. Users can add, view, update, and delete their notes seamlessly.

## 🚀 Tech Stack

**Front-end:**
- React.js
- Vite (Build Tool)
- Axios (HTTP Client)
- Deployed on **Azure Static Web Apps**
- **Authentication:** Standard email/password registration using BCrypt password hashing, paired with JSON Web Tokens (JWT) for secure session persistence.
- **Google OAuth2:** Integrated "Sign In With Google" utilizing the `@react-oauth/google` provider.

**Back-end:**
- .NET 9.0 ASP.NET Core Web API
- MongoDB (via `MongoDB.Driver`) for persistent data storage
- `DotNetEnv` for loading environment variables
- Minimal APIs mapped for CRUD operations
- Swagger/OpenAPI for documentation
- Health Checks integrated
- Deployed on **Azure App Service (Web Apps)**

**CI/CD:**
- GitHub Actions for automated build and deployment of both tiers.

## 📁 Project Structure

```text
student-notes-manager/
├── .github/workflows/          # CI/CD pipelines for frontend and backend
├── .NET back-end Web API/      # ASP.NET Core 9.0 Web API source code
└── React.js front-end/         # React + Vite frontend source code
```

## 🛠️ Local Development

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [.NET 9.0 SDK](https://dotnet.microsoft.com/download/dotnet/9.0)
- [MongoDB](https://www.mongodb.com/try/download/community) (Local instance or an Atlas cloud cluster)

### Running the Back-end
1. Navigate to the API directory:
   ```bash
   cd ".NET back-end Web API/NotesApi"
   ```
2. Build and run the project:
   ```bash
   dotnet run
   ```
3. Optional: Access the Swagger UI for testing endpoints at `http://localhost:<port>/swagger` and the health check at `http://localhost:<port>/health`. *(Note: Ensure the backend is running on `http://localhost:5000` to smoothly connect with the frontend's local development defaults).*

### Running the Front-end
1. Navigate to the frontend directory:
   ```bash
   cd "React.js front-end"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the local URL provided by Vite (e.g., `http://localhost:5173`).

## ☁️ Deployment & CI/CD

This repository uses GitHub Actions for Continuous Integration and Continuous Deployment (CI/CD):

1. **Back-end Workflow:** Builds and publishes the .NET 9 API, then deploys the artifact to Azure Web Apps using OIDC authentication.
2. **Front-end Workflow:** Installs dependencies and builds the Vite frontend manually, then uploads the `/dist` directory to Azure Static Web Apps. During the build, it dynamically injects the Azure backend URL via the `AZURE_BACKEND` repository secret.

### Necessary GitHub Secrets
To successfully run the GitHub Actions workflows, configure the following secrets in your repository (**Settings > Secrets and variables > Actions**):

- `AZURE_CLIENT_ID`, `AZURE_TENANT_ID`, `AZURE_SUBSCRIPTION_ID` — Used to authenticate and deploy to the Azure App Service via OIDC.
- `AZURE_STATIC_WEB_APPS_API_TOKEN_...` — Deployment token for the Azure Static Web App auto-generated during Azure portal creation.
- `AZURE_BACKEND` — The public URL of your deployed Azure Web App's endpoint (e.g., `https://<your-app-name>.azurewebsites.net/api/notes`).
- `JWT_SECRET` — A secure 32+ character signing key stored in the Azure deployment configuration.

Future updates :

Include rag system for notes manage 
-seperate complex note into sub tasks
-plan to achivement plan from available notes
-include credit system for notes and credits will be assigned by rag based on workload 
