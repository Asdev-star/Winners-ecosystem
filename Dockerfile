FROM node:22.12.0-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
ARG CACHEBUST=1
RUN npx prisma generate
RUN npm run build:client
RUN npx tsc -p tsconfig.server.json
EXPOSE 8080
CMD ["node", "dist/server/index.js"]
