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
- **Data Store:** In-memory list (for demonstration purposes)
- **Responsibility:** Receives HTTP requests, processes business logic (validation, data manipulation), and returns JSON responses. Also provides a `/health` endpoint for monitoring.
- **Hosting:** **Azure App Service (Web Apps)**

## 2. Data Flow

1. The user interacts with the React web interface (e.g., clicking "Add Note").
2. The React app makes an asynchronous HTTP request (via Axios) to the .NET 9 API. The API URL is dynamically determined by the `VITE_AZURE_BACKEND` environment variable.
3. The API controller validates the payload. If successful, it updates the in-memory data store and returns a success response.
4. The React front-end receives the response and updates its local state, immediately reflecting the change in the UI.

## 3. Cloud Architecture (Azure)

- **Azure Static Web Apps:** Serves the built static files (`index.html`, CSS, JS chunks) over a global CDN.
- **Azure App Service:** Hosts the .NET runtime. It is configured to accept Cross-Origin Resource Sharing (CORS) requests specifically from the frontend.
- **GitHub Actions:** Acts as the CI/CD orchestrator, pushing code changes directly to Azure upon commits to the `main` branch.