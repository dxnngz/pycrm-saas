# 🚀 Deployment Guide — PyCRM SaaS (Render + Vercel)

Stack: **Node.js backend → Render**, **React/Vite frontend → Vercel**, **PostgreSQL → Neon**, **Redis → Upstash**

---

## Step 1 — Database (Neon PostgreSQL)

1. Go to [neon.tech](https://neon.tech) and create a free account.
2. Create a new project (choose a region close to your backend, e.g. EU Frankfurt or US East).
3. Copy the **Connection String** — it will look like:
   ```
   postgresql://user:password@ep-xxx.eu-central-1.aws.neon.tech/pycrm?sslmode=require
   ```
   → Save this as `DATABASE_URL`.

---

## Step 2 — Cache (Upstash Redis)

1. Go to [upstash.com](https://upstash.com) and create a free account.
2. Create a new **Redis** database (choose Global or closest region, Free tier).
3. Go to **Connect → Node.js** and copy the URL — it will look like:
   ```
   rediss://default:password@eu2-xxx.upstash.io:6379
   ```
   → Save this as `REDIS_URL`.

---

## Step 3 — Backend (Render.com)

The backend is deployed via **Infrastructure-as-Code** (`render.yaml` in the repo root).

1. Go to [render.com](https://render.com) → **New → Blueprint**.
2. Connect your GitHub repository and select it.
3. Render detects `render.yaml` automatically and creates the `pycrm-backend` Web Service.
4. Fill in the **secret environment variables** when prompted:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Neon connection string (Step 1) |
   | `REDIS_URL` | Upstash Redis URL (Step 2) |
   | `JWT_SECRET` | A strong random string → run `openssl rand -base64 32` |
   | `FRONTEND_URL` | Leave blank for now — fill in after Step 4 |

5. Click **Apply**. Render will run the build command automatically:
   ```
   npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
   ```
   This generates the Prisma client, applies DB migrations to Neon, and compiles TypeScript.

6. Once deployed, copy your backend URL (e.g. `https://pycrm-backend.onrender.com`).

---

## Step 4 — Frontend (Vercel)

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → Import your Git repository.
2. **Root Directory**: Change to `frontend` (click Edit).
3. **Framework Preset**: Vite (auto-detected).
4. **Build & Output Settings**: Leave defaults (`npm run build` / `dist`).
5. **Environment Variables**: Add:

   | Variable | Value |
   |---|---|
   | `VITE_API_URL` | `https://pycrm-backend.onrender.com/api` |

6. Click **Deploy**. Vercel builds and publishes automatically.
7. Copy your frontend URL (e.g. `https://pycrm-enterprise.vercel.app`).

---

## Step 5 — Wire CORS (Required!)

1. Go to **Render Dashboard → pycrm-backend → Environment**.
2. Set `FRONTEND_URL` to the Vercel URL from Step 4 (e.g. `https://pycrm-enterprise.vercel.app`).
3. Click **Save Changes** — Render will restart the service automatically.

This configures CORS so the frontend can communicate with the backend.

---

## Step 6 — Verify

Open your Vercel URL in the browser and log in with the default admin account:
- **Email**: `admin@saas.com`
- **Password**: `admin123`

> ⚠️ Change the admin password immediately after your first login in production.

---

## Local Build Verification

Before pushing to Git, verify builds pass locally:

```bash
# Backend
cd backend
npm run build
# Expected: Prisma generated, TypeScript compiled to dist/

# Frontend
cd frontend
npm run build
# Expected: ✓ built in X.Xs — chunks in dist/
```

---

## Environment Variables Summary

### Backend (Render)
| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Neon PostgreSQL connection string |
| `REDIS_URL` | ✅ | Upstash Redis URL |
| `JWT_SECRET` | ✅ | Strong random secret for JWT signing |
| `FRONTEND_URL` | ✅ | Vercel frontend URL (for CORS) |
| `NODE_ENV` | auto | Set to `production` by render.yaml |
| `PORT` | auto | Set to `3000` by render.yaml |
| `SMTP_*` | optional | Email sending config (Nodemailer) |
| `S3_*` | optional | File upload config (AWS S3 / R2) |

### Frontend (Vercel)
| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | ✅ | Full backend API URL including `/api` |
