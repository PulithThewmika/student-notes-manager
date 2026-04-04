# REST API Reference

The backend exposes a simple set of RESTful endpoints to manage student notes.

## Base URLs
- **Local:** `http://localhost:5000` (Typical setup)
- **Production:** `VITE_AZURE_BACKEND` (Injected via GitHub Actions Secret)

---

## Auth Endpoints

### 1. Register User
Registers a new user and returns a JWT token.

- **POST** `/api/auth/register`
- **Request Body:** JSON
```json
{
  "email": "user@example.com",
  "username": "newuser",
  "password": "Password123"
}
```
- **Success Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUz...",
  "user": {
    "id": "64a2b1...",
    "username": "newuser",
    "email": "user@example.com",
    "avatarUrl": null
  }
}
```

### 2. Login
Logs in an existing user and returns a JWT token.

- **POST** `/api/auth/login`
- **Request Body:** JSON
```json
{
  "username": "newuser",
  "password": "Password123"
}
```

### 3. Google OAuth Login
Logs in or registers a user via Google OAuth Access Token.

- **POST** `/api/auth/google-login`
- **Request Body:** JSON
```json
{
  "credential": "<Google_OAuth_Access_Token>"
}
```

---

## Notes Endpoints (Requires JWT)

*All endpoints in this section require the `Authorization: Bearer <token>` header.*


### 1. Health Check
Checks if the API is up and running.

- **GET** `/health`
- **Output:** `Healthy`
- **Status Codes:**
  - `200 OK`: Server is operational.

---

### 1. Get All Notes
Retrieves the complete list of notes for the authenticated user, ordered descending.

- **GET** `/api/notes`
- **Headers:** `Authorization: Bearer <token>`
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
  - `401 Unauthorized`: Token is missing or invalid.

---

### 2. Create a Note
Creates a new note associated with the authenticated user.

- **POST** `/api/notes`
- **Headers:** `Authorization: Bearer <token>`
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
  - `400 Bad Request`: Validation failure (missing title, description, or userId).

---

### 3. Update a Note
Updates an existing note completely.

- **PUT** `/api/notes/{id}`
- **Headers:** `Authorization: Bearer <token>`
- **URL Parameters:**
  - `id` (string): The unique MongoDB ObjectId of the note to update.
- **Request Body:** JSON
```json
{
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

### 4. Delete / Trash a Note
Moves a specific note to the trash for the authenticated user.

- **POST** `/api/notes/{id}/trash`
- **Headers:** `Authorization: Bearer <token>`
- **URL Parameters:**
  - `id` (string): The unique MongoDB ObjectId of the note to delete.
- **Status Codes:**
  - `204 No Content`: Deletion successful.
  - `404 Not Found`: Note ID does not exist or does not belong to user.
  - `400 Bad Request`: Invalid payload or malformed ID format.
  - `401 Unauthorized`: Token is missing or invalid.