FROM node:22.12.0-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN npx prisma generate
RUN npm run build:client
RUN npx tsc -p tsconfig.server.json
RUN find dist -name "index.js" || echo "No index.js found"

EXPOSE 3001

CMD ["node", "dist/Server/index.js"]