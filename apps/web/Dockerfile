# Incident Management Web (build + static serve via nginx)
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN npm install
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
ARG VITE_DATA_MODE=http
ARG VITE_API_BASE_URL=http://localhost:3001/api
ENV VITE_DATA_MODE=$VITE_DATA_MODE
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build -w @incident/web

FROM nginx:alpine
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
