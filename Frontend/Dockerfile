# Frontend Dockerfile: build React app with Vite and serve via Nginx
# 1) Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Install deps
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build with configurable API base URL
# Pass this at build time, default to /api so we can reverse proxy
ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run build

# 2) Serve stage
FROM nginx:1.27-alpine
# Copy built assets (Vite outDir is set to "build" in vite.config.ts)
COPY --from=build /app/build /usr/share/nginx/html

# Add nginx config with /api proxy to backend service
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
