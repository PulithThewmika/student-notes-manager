# REST API Reference

The backend exposes a simple set of RESTful endpoints to manage student notes.

## Base URLs
- **Local:** `http://localhost:5000` (Typical setup)
- **Production:** `VITE_AZURE_BACKEND` (Injected via GitHub Actions Secret)

---

## Endpoints

### 1. Health Check
Checks if the API is up and running.

- **GET** `/health`
- **Output:** `Healthy`
- **Status Codes:**
  - `200 OK`: Server is operational.

---

### 2. Get All Notes
Retrieves the complete list of notes, ordered descending by ID.

- **GET** `/api/notes`
- **Response Format:** JSON
- **Success Response (200 OK):**
```json
[
  {
    "id": 1,
    "title": "Study for Calculus",
    "description": "Chapters 4 through 6",
    "isImportant": true
  }
]
```

---

### 3. Create a Note
Creates a new note.

- **POST** `/api/notes`
- **Request Body:** JSON
```json
{
  "title": "Learn React",
  "description": "Finish the useEffect module",
  "isImportant": false
}
```
- **Status Codes:**
  - `201 Created`: Note added successfully.
  - `400 Bad Request`: Validation failure (e.g., missing title).

---

### 4. Update a Note
Updates an existing note completely.

- **PUT** `/api/notes/{id}`
- **URL Parameters:**
  - `id` (integer): The unique ID of the note to update.
- **Request Body:** JSON (same structure as POST)
- **Status Codes:**
  - `200 OK`: Note updated successfully.
  - `404 Not Found`: Note ID does not exist.
  - `400 Bad Request`: Invalid payload.

---

### 5. Delete a Note
Deletes a specific note.

- **DELETE** `/api/notes/{id}`
- **URL Parameters:**
  - `id` (integer): The unique ID of the note to delete.
- **Status Codes:**
  - `204 No Content`: Deletion successful.
  - `404 Not Found`: Note ID does not exist.