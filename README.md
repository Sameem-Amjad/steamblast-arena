# SteamBlast Arena

Multiplayer educational web game for primary school children (ages 5–12). Blast opponents with water, answer maths/literacy questions to respawn, and climb the leaderboard.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose (for PostgreSQL and Redis)

### 1. Start Infrastructure
```bash
docker compose up postgres redis -d
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your secrets (JWT_SECRET is required; others optional for dev)
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Run Migrations & Seed Questions
```bash
npm run db:migrate
npm run db:seed
```

### 5. Start Development Servers
```bash
npm run dev
```
- **Client** → http://localhost:5173
- **Server** → http://localhost:3001
- **Admin** → `npm run dev:admin` → http://localhost:5174

---

## Architecture

```
steamblast-arena/
├── client/      React + Phaser.js frontend (game + UI)
├── server/      Node.js + Express + Socket.IO backend
├── shared/      Shared constants and Socket.IO event names
├── admin/       React admin panel (question management)
└── docker-compose.yml
```

## Key Features

| Feature | Status |
|---------|--------|
| Multiplayer game (2–8 players) | ✅ |
| Procedural maze generation | ✅ |
| Water spray mechanic | ✅ |
| Chamber (question to respawn) | ✅ |
| Maths & Literacy question banks | ✅ (100 questions seeded) |
| Three difficulty levels | ✅ |
| Free/Guest play | ✅ |
| Premium subscription (Stripe) | ✅ |
| Avatar creator | ✅ |
| Weekly cosmetic shop | ✅ |
| Global leaderboard | ✅ |
| Teacher dashboard | ✅ |
| Class performance analytics | ✅ |
| Parent portal / time limits | ✅ |
| Admin panel | ✅ |
| PWA (installable) | ✅ |
| Docker / CI/CD | ✅ |

## Monetization

- **Free:** Full gameplay, random avatar
- **Premium (20 HKD/month):** Custom avatar, weekly shop, leaderboard name, +25% water capacity

## Deployment

```bash
# Full production stack
docker compose up --build
```

Set all secrets in `.env` before production deployment. See `.env.example` for all required variables.
