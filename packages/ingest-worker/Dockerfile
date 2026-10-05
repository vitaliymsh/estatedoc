FROM node:22-alpine

WORKDIR /app

# Copy root workspace and ingest-worker package configs
COPY package.json package-lock.json ./
COPY packages/ingest-worker/package.json ./packages/ingest-worker/

# Install dependencies
RUN npm ci --workspace=packages/ingest-worker

# Copy worker source code
COPY packages/ingest-worker ./packages/ingest-worker

WORKDIR /app/packages/ingest-worker

ENV NODE_ENV=production
ENV INGEST_INTERVAL_HOURS=24
ENV SCRAPE_LIMIT=10

CMD ["npx", "tsx", "src/scheduler.ts"]
