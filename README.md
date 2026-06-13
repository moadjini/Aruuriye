# HaddaICaawi – Somali Crowdfunding Platform

Somalia's trusted crowdfunding platform for individuals, students, medical patients, charities, and community projects.

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS 4
- **Backend:** Next.js API Routes, Supabase
- **Database:** PostgreSQL (Supabase)
- **Auth:** Supabase Auth (Email + Google OAuth)
- **Storage:** Supabase Storage

## Features

- Three user roles: Visitor, Fundraiser, Admin
- Campaign creation with admin approval workflow
- Manual EVC Plus donation verification
- Withdrawal system with 5% platform fee
- Trust & verification levels (Phone, Identity, Trusted)
- Fraud reporting and campaign freezing
- Admin analytics dashboard
- Audit logs for all admin actions
- Email notifications (via Supabase)
- Mobile-first responsive design

## Getting Started

### 1. Clone and Install

```bash
cd HaddaICaawi
npm install
```

### 2. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_storage_buckets.sql`
3. Enable **Google OAuth** in Authentication > Providers
4. Set Site URL to `http://localhost:3000` in Authentication > URL Configuration
5. Add redirect URL: `http://localhost:3000/auth/callback`

### 3. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Supabase credentials from **Project Settings > API**:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_EVC_BUSINESS_NUMBER=61XXXXXXX
PLATFORM_FEE_PERCENT=5
```

### 4. Create Admin User

After registering your first account, promote it to admin in Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.local`
4. Update Supabase Auth redirect URLs to your production domain
5. Deploy

```bash
npm run build
npm start
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx              # Homepage
│   ├── campaigns/            # Browse & view campaigns
│   ├── auth/                 # Login, register, password reset
│   ├── dashboard/            # Fundraiser dashboard
│   ├── admin/                # Admin panel
│   └── api/                  # REST API routes
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── layout/               # Header, footer
│   ├── campaigns/            # Campaign-specific components
│   └── dashboard/            # Dashboard components
├── lib/
│   ├── supabase/             # Supabase clients
│   ├── auth.ts               # Auth helpers
│   ├── validations.ts        # Zod schemas
│   └── utils.ts              # Utilities
└── types/
    └── database.ts           # TypeScript types
supabase/
└── migrations/               # Database schema
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/campaigns` | List campaigns (with filters) |
| POST | `/api/campaigns` | Create campaign |
| POST | `/api/donations` | Submit donation |
| POST | `/api/withdrawals` | Request withdrawal |

## Payment Integration (Future)

The architecture supports future integration with:
- EVC Plus API
- Zaad API
- Sahal Pay API
- Visa / Mastercard

Currently uses manual EVC Plus workflow with admin verification.

## License

Private – All rights reserved.
