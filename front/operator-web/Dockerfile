# ── Stage 1: Build the React application with Vite ────────────────────
FROM node:20-alpine AS build

# Passed via docker-compose build.args; an empty string triggers
# same-origin (relative) URLs in the compiled frontend.
ARG VITE_LAN_IP=""
ENV VITE_LAN_IP=${VITE_LAN_IP}

WORKDIR /app

# 1. Install dependencies first (layer cached unless package files change)
COPY operator-web/package.json operator-web/package-lock.json ./
RUN npm ci

# 2. Copy operator-web source
COPY operator-web/ .

# 3. Copy the shared mobile/ library.
#    Vite resolves the @/ alias to ../mobile (from vite.config.ts __dirname),
#    which is /app/../mobile → /mobile in the container.
#    tsconfig.json also references ../mobile for type-checking.
COPY mobile/ /mobile/

# 4. Build (tsc type-checks, then Vite bundles into /app/dist)
RUN npm run build

# ── Stage 2: Serve static files + reverse proxy via nginx ─────────────
FROM nginx:1.29-alpine

# Copy the Vite build output
COPY --from=build /app/dist /usr/share/nginx/html

# Replace the default server block with our unified config
# (serves SPA static files at / and reverse-proxies /api/v1/* to backends)
COPY operator-web/nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
