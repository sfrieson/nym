FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY ./src ./src

EXPOSE 8080

# Start the application
CMD ["npm", "start"]
