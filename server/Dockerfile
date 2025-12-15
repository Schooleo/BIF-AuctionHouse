# ---- Stage 1: Dependencies ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install

# ---- Stage 2: Development ----
FROM node:20-alpine AS development
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules

EXPOSE 3001
CMD ["npm", "run", "dev"]

# ---- Stage 3: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
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
