# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source and build the application
COPY . .

# Pass VITE_API_URL during build time (if needed by build process)
# For Docker Compose, we can also use runtime env if Vite is configured for it,
# but usually Vite replaces these at build time.
ARG VITE_API_URL=/api/jobs
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ── Stage 2: Runtime ─────────────────────────────────────────────────────────
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
