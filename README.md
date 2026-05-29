# Prowider Mini Lead Distribution System

A production-ready lead distribution system built with Next.js 15, TypeScript, PostgreSQL (Neon), Prisma ORM, Tailwind CSS, and Server-Sent Events.

---

## Features

- Public lead submission form
- Automatic provider allocation (exactly 3 per lead)
- Mandatory provider assignment per service
- Fair persistent round-robin from pool
- Monthly quota enforcement
- Concurrency-safe via Prisma transactions
- Real-time dashboard via SSE
- Idempotent webhook for quota reset
- Duplicate lead prevention (phone + service unique)

---

## Business Rules

| Service   | Mandatory Providers | Pool Providers       |
|-----------|---------------------|----------------------|
| Service 1 | Provider 1          | 2, 3, 4              |
| Service 2 | Provider 5          | 6, 7, 8              |
| Service 3 | Provider 1, 4       | 2, 3, 5, 6, 7, 8     |

Each lead gets exactly **3 providers**: mandatory first, then round-robin from pool.

---

## Setup

### 1. Clone and install

```bash
cd prowider-leads
npm install
```

### 2. Set up Neon PostgreSQL

1. Go to https://console.neon.tech
2. Create a free project
3. Copy the connection string from **Connection Details**

### 3. Configure environment

Edit `.env`:

```env
DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"
WEBHOOK_SECRET="your-secret"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Run migrations

```bash
npx prisma migrate dev --name init
```

### 5. Seed the database

```bash
npx prisma db seed
```

### 6. Start development server

```bash
npm run dev
```

Open http://localhost:3000

---

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Request Service | /request-service | Public lead form |
| Dashboard | /dashboard | Real-time provider stats |
| Test Tools | /test-tools | Testing utilities |

---

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/leads | Submit a lead |
| GET | /api/services | List all services |
| GET | /api/dashboard | Dashboard data |
| GET | /api/sse | SSE stream |
| POST | /api/webhook/reset-quota | Reset monthly quota |
| POST | /api/test | Generate 10 test leads |

---

## Testing

### Manual test
1. Go to `/request-service`
2. Submit a lead
3. Open `/dashboard` — see it update in real time

### Webhook idempotency test
Go to `/test-tools` → click **Test Webhook Idempotency**
- Request 1: processes and resets quota
- Requests 2 & 3: returns `duplicate: true`, no re-processing

### Concurrency test
Go to `/test-tools` → click **Concurrency Test**
- Fires 5 concurrent batches of 10 leads
- No race conditions, no quota overflow

### cURL tests

```bash
# Submit a lead
curl -X POST http://localhost:3000/api/leads \
  -H "Content-Type: application/json" \
  -d '{"name":"John","phone":"9876543210","email":"john@test.com","serviceId":"<id>"}'

# Reset quota webhook
curl -X POST http://localhost:3000/api/webhook/reset-quota \
  -H "Content-Type: application/json" \
  -d '{"eventId":"test-event-001"}'

# Same eventId again (should return duplicate: true)
curl -X POST http://localhost:3000/api/webhook/reset-quota \
  -H "Content-Type: application/json" \
  -d '{"eventId":"test-event-001"}'
```

---

## Vercel Deployment

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/your-username/prowider-leads.git
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Add environment variables:
   - `DATABASE_URL` → your Neon connection string
   - `WEBHOOK_SECRET` → your secret
   - `NEXT_PUBLIC_APP_URL` → your Vercel URL (e.g. https://prowider-leads.vercel.app)
4. Click **Deploy**

### 3. Run migrations on production

After deploy, run once from your local machine pointing to production DB:

```bash
npx prisma migrate deploy
npx prisma db seed
```

---

## Project Structure

```
prowider-leads/
├── app/
│   ├── api/
│   │   ├── leads/route.ts          # POST - submit lead
│   │   ├── services/route.ts       # GET - list services
│   │   ├── dashboard/route.ts      # GET - dashboard data
│   │   ├── sse/route.ts            # GET - SSE stream
│   │   ├── webhook/reset-quota/    # POST - idempotent webhook
│   │   └── test/route.ts           # POST - generate test leads
│   ├── request-service/page.tsx    # Lead submission form
│   ├── dashboard/page.tsx          # Real-time dashboard
│   ├── test-tools/page.tsx         # Test utilities
│   ├── layout.tsx                  # Root layout + nav
│   └── globals.css
├── lib/
│   ├── prisma.ts                   # DB client singleton
│   ├── allocation.ts               # Round-robin allocation logic
│   ├── emitter.ts                  # SSE event emitter
│   └── types.ts                    # TypeScript types
├── prisma/
│   ├── schema.prisma               # DB models
│   └── seed.ts                     # Seed data
└── .env                            # Environment variables
```
