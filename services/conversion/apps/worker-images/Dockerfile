FROM node:20-bookworm-slim

# libvips runtime deps for sharp prebuilt binary
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     libglib2.0-0 libexpat1 libfftw3-bin libpng16-16 \
     libjpeg62-turbo libwebp7 libwebpdemux2 libwebpmux3 \
     libtiff6 libheif1 librsvg2-2 \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package*.json ./
COPY tsconfig.json ./
COPY packages/shared ./packages/shared
COPY apps/worker-images ./apps/worker-images

RUN npm install
RUN npm run build -w packages/shared && npm run build -w apps/worker-images

CMD ["npm", "run", "start", "-w", "apps/worker-images"]
