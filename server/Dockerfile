FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src
COPY ../shared /app/shared

EXPOSE 3001
CMD ["node", "src/index.js"]
