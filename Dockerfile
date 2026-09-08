# Bagdja Novelo API (NestJS) — build image untuk deploy di Coolify.
# Pola sama dengan service lain di ekosistem Bagdja (lihat
# app/website/bagdja-website-api/Dockerfile, app/auction-market/bagdja-auction-api/Dockerfile):
# 2-stage alpine build, tanpa reinstall di stage production (pakai
# node_modules yang sudah di-prune).
#
# CATATAN: base image node:22 (BUKAN node:20) — @bagdja/node-sdk mensyaratkan
# Node >=22 (EBADENGINE warning di Node 20), konsisten dengan service lain.

# Stage 1: build + prune dev deps
#
# CATATAN: `npm install`, BUKAN `npm ci` — supaya build tidak gagal kalau
# package-lock.json belum 100% sinkron (mis. optional dependency
# platform-specific yang beda antara mesin dev dan base image Linux ini).
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install --include=dev --no-audit --no-fund
COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Stage 2: production
FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist

# Distandarkan ke 3000 (semua app di Coolify pakai port yang sama) — BEDA
# dari PORT di .env lokal (5020, itu cuma untuk `npm run start:dev` di mesin
# dev, tidak dipakai image ini sama sekali). `main.ts` baca `process.env.PORT`
# secara dinamis, jadi kalau suatu saat perlu port lain di Coolify, cukup
# override lewat env var di sana, TIDAK perlu ubah Dockerfile ini.
ENV PORT=3000
EXPOSE 3000

# Healthcheck Coolify: GET /health (src/modules/health/health.controller.ts)
#
# CATATAN: entry point `dist/src/main.js` (bukan `dist/main.js`) — tsconfig.json
# tidak set `rootDir`, dan `scripts/run-migration.ts` (di luar src/) ikut
# ter-compile karena tidak ada exclude eksplisit, jadi TypeScript hitung
# common root = folder project dan struktur src/ tetap dipertahankan di
# bawah dist/ (pola sama persis dengan bagdja-auction-api, dikonfirmasi di sana).
CMD ["node", "dist/src/main.js"]
