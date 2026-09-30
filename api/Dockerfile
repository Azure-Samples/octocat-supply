FROM node:25-alpine AS builder

WORKDIR /app
COPY ./package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:25-alpine
WORKDIR /app
COPY ./package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/database ./database

EXPOSE 3000
CMD ["npm", "start"]
