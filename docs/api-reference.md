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
Retrieves the complete list of notes for a specific user, ordered descending.

- **GET** `/api/notes?userId={userId}`
- **URL Parameters:**
  - `userId` (string, required): A unique identifier for the specific user's session (e.g., UUID format).
- **Response Format:** JSON
- **Success Response (200 OK):**
```json
[
  {
    "id": "64a2b1c3d1234567890abcde",
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "title": "Study for Calculus",
    "description": "Chapters 4 through 6",
    "isImportant": true
  }
]
```
- **Status Codes:**
  - `200 OK`: Request successful.
  - `400 Bad Request`: `userId` was not provided.

---

### 3. Create a Note
Creates a new note associated with a user ID.

- **POST** `/api/notes`
- **Request Body:** JSON
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Learn React",
  "description": "Finish the useEffect module",
  "isImportant": false
}
```
- **Status Codes:**
  - `201 Created`: Note added successfully.
  - `400 Bad Request`: Validation failure (missing title, description, or userId).

---

### 4. Update a Note
Updates an existing note completely.

- **PUT** `/api/notes/{id}`
- **URL Parameters:**
  - `id` (string): The unique MongoDB ObjectId of the note to update.
- **Request Body:** JSON
```json
{
  "userId": "123e4567-e89b-12d3-a456-426614174000",
  "title": "Updated Title",
  "description": "Updated description content",
  "isImportant": true
}
```
- **Status Codes:**
  - `200 OK`: Note updated successfully.
  - `404 Not Found`: Note ID does not exist or userId does not match.
  - `400 Bad Request`: Invalid payload or malformed ID format.

---

### 5. Delete a Note
Deletes a specific note.

- **DELETE** `/api/notes/{id}?userId={userId}`
- **URL Parameters:**
  - `id` (string): The unique MongoDB ObjectId of the note to delete.
  - `userId` (string, required): The unique identifier of the user executing the delete.
- **Status Codes:**
  - `204 No Content`: Deletion successful.
  - `404 Not Found`: Note ID does not exist or userId does not match.
  - `400 Bad Request`: Invalid payload, missing userId, or malformed ID format.