FROM node:22-alpine

WORKDIR /app

# Copy root workspace & backend manifests
COPY package.json package-lock.json ./
COPY packages/backend/package.json ./packages/backend/

# Install backend dependencies
RUN npm ci --workspace=packages/backend

# Copy backend source code
COPY packages/backend ./packages/backend

WORKDIR /app/packages/backend

ENV NODE_ENV=production
ENV PORT=4000
ENV HOST=0.0.0.0

EXPOSE 4000

CMD ["sh", "-c", "npm run db:migrate && npx tsx src/index.ts"]
