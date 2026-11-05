# CampusConnect

CampusConnect is a campus event platform with a **React + Vite** frontend, a **FastAPI** backend, and **Supabase** for database and authentication.

---

## Architecture Overview

- **Frontend**: React 19, TypeScript, Vite, Lucide Icons, `@supabase/supabase-js`.
- **Backend**: FastAPI (Python 3.10+), Pydantic, Uvicorn, Supabase Python Client.
- **Database & Auth**: Supabase PostgreSQL database + Supabase Auth.
- **Deployment**: Vercel-ready with Serverless ASGI handlers and CORS configured.

---

## Local Development

### 1. Setup and Run the FastAPI Backend

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Activate your virtual environment:
   - Windows PowerShell:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - macOS / Linux:
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Verify your `.env` contains:
   ```env
   SUPABASE_URL=https://<your-project>.supabase.co
   SUPABASE_PUBLISHABLE_KEY=<your-publishable-key>
   ```
5. Start the server (runs on port 5001 to align with Vite proxy):
   ```bash
   python app.py
   # OR:
   uvicorn main:app --port 5001 --reload
   ```
   Interactive OpenAPI documentation is available at `http://127.0.0.1:5001/docs`.

### 2. Run the React Frontend

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```
4. Open the printed localhost URL in your browser. Vite proxies `/api/*` calls directly to `http://127.0.0.1:5001`.

---

## Deploying to Vercel Without Errors

The backend is configured to work out-of-the-box on Vercel with zero runtime crashes:

### Option A: Deploying Backend as a Dedicated Vercel Project (Recommended for Microservices)

1. In your **Vercel Dashboard**, click **Add New... -> Project** and import this repository.
2. Under **Root Directory**, click **Edit** and select **`backend`**.
3. In **Environment Variables**, add:
   - `SUPABASE_URL` = `https://<your-project>.supabase.co`
   - `SUPABASE_PUBLISHABLE_KEY` = `your-supabase-publishable-key`
4. Click **Deploy**. Vercel will install `requirements.txt` and route all requests through `api/index.py` using FastAPI.

### Option B: Deploying from the Repository Root

1. Import the repository with **Root Directory** set to `./` (root).
2. Set the same Environment Variables (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).
3. Click **Deploy**. Vercel will detect root `api/index.py` and route `/api/*` to FastAPI.

---

## API Endpoints

| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/` | HTML view of users | No |
| `GET` | `/api/health` | Service health status | No |
| `GET` | `/api/events` | List all campus events | No |
| `GET` | `/api/events/{event_id}` | Get event details by ID | No |
| `POST` | `/api/registrations` | Register for an event | Yes (Bearer token) |
| `GET` | `/api/me/registrations` | List current user registrations | Yes (Bearer token) |
| `GET` | `/api/events/{event_id}/registrations` | Organizer view of attendees | Yes (Organizer) |
| `GET` | `/docs` | Swagger interactive API docs | No |

