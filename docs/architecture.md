# Architecture Overview

This document outlines the high-level architecture of the **Student Notes Manager** application.

## 1. System Components

The application is divided into two primary tiers: a client-side frontend and a server-side backend, both deployed independently to Microsoft Azure.

### Front-end (Client Tier)
- **Framework:** React.js
- **Build Tool:** Vite
- **HTTP Client:** Axios
- **Responsibility:** Handles user interface, state management, and rendering of notes. It communicates with the backend via RESTful API calls.
- **Hosting:** **Azure Static Web Apps**

### Back-end (API Tier)
- **Framework:** .NET 9.0 (ASP.NET Core Minimal APIs)
- **Data Store:** **MongoDB** (via `MongoDB.Driver`), storing documents segmented by user context.
- **Environment Management:** Uses `DotNetEnv` locally to manage secrets and connection descriptors.
- **Responsibility:** Receives HTTP requests, handles anonymous user isolation, processes business logic (validation, data manipulation), and stores/returns JSON data. Also provides a `/health` endpoint for monitoring.
- **Hosting:** **Azure App Service (Web Apps)**

## 2. Data Flow & Security (JWT Authentication & Google OAuth)

The system uses a robust JSON Web Token (JWT) based authentication model, alongside Google OAuth2 integration for a seamless login experience:

1. A user can either register an account normally (triggering BCrypt password hashing) or log in securely via the Google OAuth button on the React frontend.
2. The .NET API validates the credentials (or Google OAuth access tokens via the server-side Google APIs) and produces a signed JWT.
3. The React frontend stores this JWT and the user's profile details in its state/local storage.
4. Every subsequent HTTP request to the .NET 9 API (via Axios) includes this JWT in the `Authorization: Bearer <token>` header.
5. The API endpoints are protected by `[Authorize]` (or `.RequireAuthorization()`), ensuring only authenticated requests pass. The `userId` is extracted securely from the token's claims, preventing users from accessing others' data.
6. The backend interacts directly with MongoDB to persist or adjust records safely, strictly logic-gated by the `userId`.

## 3. Cloud Architecture (Azure)

- **Azure Static Web Apps:** Serves the built static files (`index.html`, CSS, JS chunks) over a global CDN.
- **Azure App Service:** Hosts the .NET runtime. It is configured to accept Cross-Origin Resource Sharing (CORS) requests specifically from the frontend.
- **GitHub Actions:** Acts as the CI/CD orchestrator, pushing code changes directly to Azure upon commits to the `main` branch.