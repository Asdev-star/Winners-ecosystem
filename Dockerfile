FROM node:22.12.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build:client
RUN npx tsc -p tsconfig.server.json
RUN ls -la dist/ && ls -la dist/server/ || echo "dist/server not found"

EXPOSE 3001

CMD ["node", "dist/server/index.js"]