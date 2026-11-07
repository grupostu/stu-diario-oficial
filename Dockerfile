FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json tsconfig.json ./
RUN npm install
COPY src ./src
RUN npx tsc

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4700
COPY package.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist

EXPOSE 4700
USER node
CMD ["node", "dist/server.js"]
