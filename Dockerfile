# syntax=docker/dockerfile:1
FROM node:20-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install production dependencies first to leverage the Docker layer cache
COPY package*.json ./
RUN npm ci --omit=dev

COPY src ./src

# Run as the unprivileged user provided by the base image
USER node

EXPOSE 3000
CMD ["node", "src/index.js"]
