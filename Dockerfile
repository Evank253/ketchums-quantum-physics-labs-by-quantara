FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json bun.lockb* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/.output ./.output
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
CMD ["npm","run","preview","--","--host","0.0.0.0","--port","3000"]
