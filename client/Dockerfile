# ---- Stage 1: Base ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# ---- Stage 2: Development ----
FROM base AS development
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ---- Stage 3: Build ----
FROM base AS builder
RUN npm run build

# ---- Stage 4: Serve ----
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
