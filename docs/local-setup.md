# Local Setup & Development

Follow these instructions to run the Student Notes Manager application on your local machine.

## Prerequisites
- **Node.js**: v18.x or later. (For running React and Vite)
- **.NET SDK**: v9.0 or later. (For compiling and running the ASP.NET Core API)
- **Git**: For version control.
- **VS Code**: Or any code editor of your choice.

---

## 1. Running the API (Backend)

The API is built using ASP.NET Core Minimal APIs.

1. Open your terminal.
2. Navigate to the backend directory:
   ```bash
   cd ".NET back-end Web API/NotesApi"
   ```
3. Run the application:
   ```bash
   dotnet run
   ```
4. Verification:
   The terminal will output the local ports it is listening on (usually `http://localhost:5000` or `https://localhost:5001`). 
   - Test the health endpoint: Open `http://localhost:5000/health` in your browser. It should say `Healthy`.

---

## 2. Running the Frontend (Client)

The frontend is a React application built with Vite.

1. Open a **new** terminal window.
2. Navigate to the frontend directory:
   ```bash
   cd "React.js front-end"
   ```
3. Install the NPM dependencies (first time only):
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. Verification:
   Vite will start a local server (usually on `http://localhost:5173`). Open this URL in your web browser.

### Connecting Frontend to Backend Locally
By default, the Vite application is configured to look for the backend at `http://localhost:5000/api/notes`. As long as your `dotnet run` instance is running on port 5000, they will communicate seamlessly without additional configuration.

If your backend binds to a different port, you can temporarily modify the `API_BASE` variable in `App.jsx`, or create a `.env` file in the frontend folder:
```env
VITE_AZURE_BACKEND=http://localhost:<YOUR_PORT>/api/notes
```