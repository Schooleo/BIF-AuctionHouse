# ---- Stage 1: Base ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ---- Stage 2: Development ----
FROM base AS development
EXPOSE 3001
CMD ["npm", "run", "dev"]

# ---- Stage 3: Build ----
FROM base AS builder
RUN rm -rf dist
RUN npm run build

# ---- Stage 4: Production ----
FROM node:20-alpine AS production
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY .env .env
COPY --from=builder /app/src/config ./config
EXPOSE 3001
CMD ["node", "dist/server.js"]
