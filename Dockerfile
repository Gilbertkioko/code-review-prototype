# Fly.io: SvelteKit (adapter-node) + Socket.IO via server.js
# https://fly.io/docs/languages-and-frameworks/node/

FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY patches ./patches

RUN npm ci

COPY . .

RUN npm run build

# --- runtime ---

FROM node:20-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY patches ./patches

# --ignore-scripts: postinstall runs `patch-package`, which is not installed with --omit=dev
RUN npm ci --omit=dev --ignore-scripts \
	&& npx --yes patch-package@8.0.1 \
	&& npm cache clean --force

COPY --from=builder /app/build ./build
COPY server.js socket-setup.mjs ./

EXPOSE 3000

ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", "server.js"]
