FROM node:20-bullseye-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
  ffmpeg \
  ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package.json package-lock.json* ./
RUN npm ci --production || npm install --production

COPY . .

RUN npm run build || true

EXPOSE 3000
CMD ["node", "dist/server.js"]
