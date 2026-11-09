# Imágenes base fijadas por versión exacta + digest (build reproducible). Para actualizar:
#   docker buildx imagetools inspect <imagen>:<tag>   -> copiar "Digest:" y verificar la versión (node --version, etc.)
FROM node:22.23.4-alpine3.24@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml tsconfig.json ./
RUN corepack enable && pnpm install --frozen-lockfile --ignore-scripts
COPY src ./src
COPY public ./public
RUN npm run build

FROM node:22.23.4-alpine3.24@sha256:0e1754758c2df4cfa3e68d59e2e1b7374bb7fd9ea6328eaaacf15cc934af8202 AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=384"
ENV PORT=4700
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile --prod --ignore-scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/src ./src
COPY --from=builder /app/public ./public

EXPOSE 4700
USER node
# Comprobación de salud (mismo endpoint que usa docker-compose.prod.yml)
HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4700/health >/dev/null || exit 1

CMD ["node", "dist/server.js"]
