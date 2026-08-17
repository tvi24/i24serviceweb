# Incident Management API
FROM node:24-alpine AS base
WORKDIR /app

# Install workspace dependencies
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/api/package.json ./apps/api/package.json
RUN npm install --omit=dev=false

# Copy sources
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

ENV NODE_ENV=production
EXPOSE 3001

# Runs migrations + seed, then starts the API (tsx runs TS directly).
CMD ["sh", "-c", "npm run migrate -w @incident/api && npm run seed -w @incident/api && npm run start -w @incident/api"]
