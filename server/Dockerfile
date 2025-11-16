# ---- Stage 1: Build ----
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files and install deps
COPY package*.json ./
RUN npm install

# Copy all source files
COPY . .

# Clean old build (important!)
RUN rm -rf dist

# Build fresh
RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-alpine
WORKDIR /app

# Copy only necessary files
COPY package*.json ./
RUN npm install --omit=dev

# Copy compiled JS from builder
COPY --from=builder /app/dist ./dist

# Copy environment variables
COPY .env .env

# Copy any other runtime config if needed
COPY --from=builder /app/src/config ./config

EXPOSE 3001

CMD ["node", "dist/server.js"]
