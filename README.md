# MatchIQ-Frontend
Logic frontend

# 🚀 MatchIQ
Plataforma inteligente de matching entre empresas y candidatos.

## 🧠 Funcionalidades
- Login
- SignUp
- Create Offers
- Matching IA
- Dashboard
- Ranking
- Feedback

## 🏗️ Arquitectura
- Backend: FastAPI
- Frontend: Angular
- DB: PostgreSQL
- IA: OpenAI

## ⚙️ Setup
```bash
pip install -r requirements.txt
uvicorn main:app --reload


🔐 Auth

JWT + Roles

📌 Flujo DevOps

Issue → Branch → Commit → PR → Review → Tests → Merge develop → Release → main → Deploy

🧠 Arquitectura lógica

Frontend → API Gateway → Auth → Services → AI Engine → DB
