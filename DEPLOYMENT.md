# Deployment Guide: Enterprise SaaS (Render + Vercel + Neon + Upstash)

This guide provides step-by-step instructions to deploy your PyCRM SaaS Enterprise platform completely free, without relying on Docker, ensuring all features (Multi-tenant, Caching, Auth, WebSockets/Performance) work identical to local development.

## 1. Database Setup (Neon PostgreSQL)
1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Create a new project and select the region closest to your future backend (e.g., US East or Europe Frankfurt).
3. Copy the provided connection string.
   > **Format expected:** `postgresql://postgres:password@ep-cool-butterfly.eu-central-1.aws.neon.tech/pycrm?sslmode=require`

## 2. Cache Setup (Upstash Redis)
1. Go to [upstash.com](https://upstash.com) and sign up.
2. Create a new Redis database. Select the **Global (or closest region)** and choose the Free tier.
3. Scroll down to *Connect* -> Node.js (ioredis/redis) and copy the URL.
   > **Format expected:** `rediss://default:password@eu2-striking-panther-xxxxx.upstash.io:6379`

## 3. Backend Deployment (Render.com)
The backend is prepared for **Infrastructure-as-Code** deployment via `render.yaml`.
1. Go to [render.com](https://render.com) and connect your GitHub/GitLab repository.
2. Go to the **Blueprints** tab on the left menu.
3. Click **New Blueprint Instance** and select your PyCRM repository.
4. Render will automatically detect the `render.yaml` file located in `backend/` and prepare a "Web Service" named `pycrm-backend`.
5. **Environment Variables**: Render will ask you to fill in the missing secrets specified in the `render.yaml`:
   - `DATABASE_URL` -> Base the Neon URL.
   - `REDIS_URL` -> Paste the Upstash URL.
   - `JWT_SECRET` -> Generate a strong random string (e.g. `openssl rand -base64 32`).
   - `FRONTEND_URL` -> (Leave blank for a minute until we deploy Vercel, then come back and paste it!)

> **Note on Build**: The `render.yaml` automatically runs `npm install && npm run build` (which includes `npx prisma generate`).

## 4. Frontend Deployment (Vercel)
The frontend uses Vite, which is highly optimized for Vercel.
1. Go to [vercel.com](https://vercel.com) and deploy a new Project from your Git repository.
2. **Framework Preset**: Vercel should auto-detect *Vite*.
3. **Root Directory**: Click "Edit" and change the root directory to `frontend`.
4. **Environment Variables**: Add the following variable:
   - `VITE_API_URL` -> Paste the Render Backend URL (e.g., `https://pycrm-backend.onrender.com/api`)
5. Click **Deploy**. Vercel will build the `dist` folder automatically.

## 5. Final Checklist & Wiring
1. Retrieve your new Frontend URL from Vercel (e.g., `https://pycrm-enterprise.vercel.app`).
2. Go back to your **Render Backend Dashboard** -> Environment.
3. Update `FRONTEND_URL` to the Vercel URL. This configures **CORS** correctly.
4. Restart the Render Web Service so it picks up the CORS change.

---

### Command Validations (Local Troubleshooting)
Before pushing to Git for deployment, ensure your local build pipeline succeeds:

```bash
# Backend
cd backend
npm run build 
# Expected: "Generated Prisma Client... tsc compilation successful"

# Frontend
cd frontend
npm run build
# Expected: "✓ built in X.Xs... code splitting chunks generated"
```

Everything is robustly separated. The `customFetch` interceptor on the frontend dynamically uses `VITE_API_URL` when in Vercel, and falls back to proxy `/api` locally. Enjoy your fully-fledged SaaS!
