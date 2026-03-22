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

## 2. Data Flow & Security (Anonymous Sessions)

In this iteration, the system uses "headless" or anonymous sessions instead of a full login system to reduce friction while still mapping data uniquely per person:

1. When a user opens the application, the React frontend generates a unique UUID (if one does not already exist) and persists it using the browser's `localStorage`.
2. Every subsequent HTTP request to the .NET 9 API (via Axios) includes this generated `userId` as either a query parameter or body property.
3. The API controller strictly filters and maps all queries and mutations against this `userId`, guaranteeing users can only interact with their own resources.
4. The backend interacts directly with MongoDB to persist or adjust records safely logic-gated by the `userId`.
5. The React front-end receives the response and updates its local state, seamlessly reflecting the changes.

## 3. Cloud Architecture (Azure)

- **Azure Static Web Apps:** Serves the built static files (`index.html`, CSS, JS chunks) over a global CDN.
- **Azure App Service:** Hosts the .NET runtime. It is configured to accept Cross-Origin Resource Sharing (CORS) requests specifically from the frontend.
- **GitHub Actions:** Acts as the CI/CD orchestrator, pushing code changes directly to Azure upon commits to the `main` branch.