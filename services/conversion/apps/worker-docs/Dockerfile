FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     libreoffice pandoc ca-certificates file fontconfig fonts-liberation fonts-noto \
     poppler-utils \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/worker-docs ./apps/worker-docs

RUN npm install
RUN npm run build -w packages/shared && npm run build -w apps/worker-docs

CMD ["npm", "run", "start", "-w", "apps/worker-docs"]
