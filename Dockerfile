FROM node:20-alpine
WORKDIR /app
COPY package*.json bun.lockb* ./
RUN npm ci --only=production || npm install --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm","run","preview","--","--host","0.0.0.0","--port","3000"]
