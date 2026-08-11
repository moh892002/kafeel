# ---- Build stage: bundle the SPA ----
FROM node:22-alpine AS build
WORKDIR /app

# Install from the lockfile (fast + reproducible) before copying source so
# this layer is cached unless package.json changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ---- Serve stage: nginx with the SPA + /api reverse proxy ----
FROM nginx:stable-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
