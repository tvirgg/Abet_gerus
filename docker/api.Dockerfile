FROM node:22-alpine as builder

WORKDIR /app

# 1. Копируем package.json
COPY apps/api/package*.json ./apps/api/

# 3. Устанавливаем зависимости (игнорируем скрипты, чтобы не запускался prisma generate из старого lock-файла)
RUN cd apps/api && npm install --ignore-scripts

# 4. Копируем исходный код
COPY apps/api ./apps/api

# 4. Собираем приложение
WORKDIR /app/apps/api
RUN npm run build

# --- Stage 2: Runner ---
FROM node:22-alpine as runner

WORKDIR /app/apps/api

# Копируем собранное приложение и зависимости
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/package.json ./package.json
COPY --from=builder /app/apps/api/src ./src
COPY --from=builder /app/apps/api/tsconfig*.json ./

CMD ["npm", "run", "start"]
