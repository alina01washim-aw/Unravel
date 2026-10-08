# UNRAVEL AI

This repository contains the initial skeleton for the UNRAVEL AI project.

## Stack
- Frontend: Next.js, TypeScript, Tailwind
- Backend: FastAPI, Python 3.12
- Data: Supabase PostgreSQL + PostGIS
- ML: scikit-learn, XGBoost

## Local development

### Frontend
npm --workspace apps/web run dev

### Backend
cd services/api
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000

## Health checks
- Frontend: http://localhost:3000
- Backend: http://127.0.0.1:8000/health
