# EstatePlanner

Real estate aggregator that pulls listings from Polish property portals, normalizes the data into MySQL, and provides structured and natural language search.

## Setup

### Prerequisites
- Node.js 20+
- Docker and Docker Compose (for MySQL)

### Environment
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Main environment variables:
| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | MySQL connection string | `mysql://estateplanner:estateplanner_secret@localhost:3308/estateplanner` |
| `PORT` | Backend server port | `4000` |
| `GEMINI_API_KEY` | Gemini API key for natural language search | Optional |
| `OPENROUTER_API_KEY` | OpenRouter key for listing enrichment | Optional |
| `TEMPORARY_KEY` | Access key for the public demo to prevent AI quota misuse | Optional |

### Database
Start MySQL and run migrations:
```bash
npm run db:up
npm run db:migrate
```

### Ingest listings
Fetch offers from supported portals (Sprzedajemy, Morizon, Otodom, Gratka):
```bash
# Pull 25 listings per portal (~100 total) into the database
npm run ingest -- --portal=all --limit=25
```

Other options:
```bash
# Target one portal
npm run ingest -- --portal=morizon --limit=50

# Skip detail page scraping
npm run ingest -- --portal=otodom --limit=30 --no-enrich
```

### Run
Start the backend and frontend together:
```bash
npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:4000

## Docker

Run the full stack (MySQL, backend, ingest scheduler):
```bash
docker compose up --build -d
```

## Tests

Run vitest across all packages:
```bash
npm test
```

## Architecture

```
docplanner/
├── packages/
│   ├── backend/         # Fastify API, Drizzle ORM, search routes
│   ├── frontend/        # React 19, Vite, Tailwind CSS, Leaflet map
│   └── ingest-worker/   # Scrapers (cheerio, JSON-LD, __NEXT_DATA__), normalizers
```
