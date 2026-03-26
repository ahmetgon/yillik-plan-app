FROM node:20-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner

WORKDIR /app

# Copy server dependencies and built frontend
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server ./server

# Create data directory for SQLite databases
RUN mkdir -p /app/data

# Install a simple static file server alongside Express
RUN npm install -g serve

ENV NODE_ENV=production
ENV PORT=3070

# Volume for persistent SQLite data
VOLUME ["/app/data"]

EXPOSE 3070

# Start Express server (serves API + static files)
CMD ["npx", "tsx", "server/index.ts"]
