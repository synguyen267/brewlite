FROM node:22-slim
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate && npm run build
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]