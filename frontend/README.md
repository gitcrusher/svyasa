# CampusConnect frontend

The React app provides event discovery, event details, registration, and a view
of the signed-in user's registrations.

## Run locally

1. Start the FastAPI backend from `backend` with `python app.py` (or `uvicorn main:app --port 5001 --reload`).
2. From this directory, run `npm install` once and `npm run dev`.
3. Open the Vite URL printed in the terminal.

Vite forwards `/api` requests to the FastAPI backend. Supabase sign-in reads
`SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` from `backend/.env`; these can
also be overridden with `VITE_SUPABASE_URL` and
`VITE_SUPABASE_PUBLISHABLE_KEY` in a frontend environment file. Only the
publishable key is exposed to the browser. Registration requires a signed-in
Supabase account.
