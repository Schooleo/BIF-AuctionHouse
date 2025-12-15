# ---- Stage 1: Dependencies only ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps

# ---- Stage 2: Development ----
FROM node:20-alpine AS development
WORKDIR /app

# reuse node_modules
COPY --from=deps /app/node_modules ./node_modules

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---- Stage 3: Build ----
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Stage 4: Serve ----
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
