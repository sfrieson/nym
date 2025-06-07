FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

COPY ./public ./public
COPY ./src ./src

EXPOSE 8080

ENV PORT=8080

CMD ["npm", "start"]
