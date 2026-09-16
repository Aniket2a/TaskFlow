# TaskFlow Backend (FastAPI)

FastAPI REST API powering the TaskFlow productivity application for students and developers.

> ⚠️ **CRITICAL SECURITY NOTICE**: Never store service-account keys or private keys in source code or version control. Always provide credentials via environment variables (`.env`). Ensure `service-account*.json` is ignored by `.gitignore`.

## Tech Stack
- **Python 3.10+**
- **FastAPI** (High-performance async REST framework)
- **Uvicorn** (ASGI server)
- **Pydantic v2** (Strongly typed data contracts & validation)
- **Firebase Admin SDK** (Cryptographic token verification & Firestore persistence)
- **Pytest + HTTPX** (Unit and integration testing)

## Environment Variables

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `FIREBASE_PROJECT_ID` | Your Firebase Project ID |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin Service Account email |
| `FIREBASE_PRIVATE_KEY` | Private key (with `\n` linebreaks intact) |
| `FRONTEND_ORIGIN` | Allowed CORS origin (e.g., `http://localhost:3000`) |
| `PORT` | Backend port (default `8000`) |

## Quick Start

```bash
# 1. Create and activate virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run development server
uvicorn app.main:app --reload --port 8000
```

## Running Tests

```bash
# Run backend test suite
pytest tests/ -v
```

## API Endpoints

| Method | Endpoint | Protection | Description |
|---|---|---|---|
| `GET` | `/health` | Public | Service health status |
| `GET` | `/api/v1/meta` | Public | System metadata and specs |
| `GET` | `/api/v1/auth/verify` | Bearer Token | Verifies Firebase ID token & claims |
| `GET` | `/api/v1/tasks` | Bearer Token | Lists all tasks for authenticated user |
| `POST` | `/api/v1/tasks` | Bearer Token | Creates a new task (201 Created) |
| `GET` | `/api/v1/tasks/{task_id}` | Bearer Token | Retrieves a specific task |
| `PATCH` | `/api/v1/tasks/{task_id}` | Bearer Token | Updates task fields |
| `DELETE` | `/api/v1/tasks/{task_id}` | Bearer Token | Deletes a task (204 No Content) |
| `GET` | `/api/v1/projects` | Bearer Token | Lists workspace projects |
| `POST` | `/api/v1/projects` | Bearer Token | Creates a new project |
| `PATCH` | `/api/v1/projects/{project_id}` | Bearer Token | Updates project |
| `DELETE` | `/api/v1/projects/{project_id}` | Bearer Token | Deletes project & unlinks tasks |
| `GET` | `/api/v1/tags` | Bearer Token | Lists user tags |
| `POST` | `/api/v1/tags` | Bearer Token | Creates a new tag |
| `DELETE` | `/api/v1/tags/{tag_id}` | Bearer Token | Deletes a tag |

Interactive Docs:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

