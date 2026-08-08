# LeetSync

**Stay accountable on LeetCode with your friends.**

LeetSync helps small groups of friends stay consistent on LeetCode through daily rotating problem assignments, completion tracking, and leaderboards. The goal is accountability and consistency — not problem discovery.

## Features

- 🎯 **Daily Rotating Problem Setter** — Each team member takes turns setting the day's problems
- ✅ **Completion Tracking** — Mark problems as completed with optional "Used Leet AI" toggle
- 🏆 **Leaderboards** — Compete with friends based on points (10/5/0 scoring per day)
- 🔥 **Streaks** — Track current and longest streaks of consecutive solving days
- 📊 **Team Statistics** — See your group's overall progress
- 📅 **Full History** — Browse any past day's problems and completions
- 👤 **User Profiles** — GitHub-style activity heatmap and detailed stats
- 🔐 **Team Admin** — Owner-only controls for member management and settings

## Tech Stack

| Layer      | Technology                 |
|------------|---------------------------|
| Framework  | Next.js 14+ (App Router)  |
| Language   | TypeScript                |
| Styling    | Tailwind CSS + shadcn/ui  |
| Animation  | Framer Motion             |
| Database   | PostgreSQL via Supabase   |
| ORM        | Prisma                    |
| Auth       | Supabase Auth (email+pw)  |
| Hosting    | Vercel Hobby (free tier)  |

## Free Tier Only

This project runs entirely on free tiers:
- **Vercel Hobby** — zero-config deployment
- **Supabase Free** — PostgreSQL + Auth + API

### Supabase Keep-Alive

Supabase free projects normally pause after 7 days of inactivity. This is handled by an external pinger that hits the Supabase URL every 10 minutes. No app code accounts for cold starts.

## Setup

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) account (free)

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd leetsync
npm install
```

### 2. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Project Settings > API** and copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - Anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Service role key → `SUPABASE_SERVICE_ROLE_KEY`
3. Go to **Project Settings > Database** and copy:
   - Transaction pooler URL → `DATABASE_URL` (add `?pgbouncer=true`)
   - Direct connection URL → `DIRECT_URL`
4. Go to **Authentication > Providers > Email** and:
   - Enable email/password sign-in
   - **For local testing**: disable "Confirm email" requirement
   - **For production**: re-enable email confirmation

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your values in `.env.local`.

### 4. Database Migration

```bash
npx prisma migrate dev --name init
```

This creates all 6 tables in your Supabase database.

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploying to Vercel

1. Push to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add all environment variables in **Vercel > Project Settings > Environment Variables**
4. Deploy — zero config needed

## Scoring System

| Completions | Points |
|-------------|--------|
| Both done   | 10     |
| One done    | 5      |
| None        | 0      |

- Total score = sum of daily scores
- Completion timestamp is used **only** for tiebreaking (earliest wins)
- No difficulty weighting — consistency only

## Data Model

6 tables, all created in the initial migration:

- **User** — mirrors Supabase auth, with username
- **Team** — independent group with code + password
- **TeamMembership** — join table with rotation position
- **DailyProblem** — one per team per day, two problems
- **CompletionRecord** — per-user, per-problem tracking (completedAt is write-once)
- **ActivityLog** — audit trail for team events

## License

MIT
