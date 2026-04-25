# syntax=docker/dockerfile:1

ARG NODE_VERSION=22.13.1
FROM node:${NODE_VERSION}-alpine

ENV NODE_ENV=production
WORKDIR /usr/src/app

# Install runtime dependencies
RUN apk add --no-cache su-exec

# Install npm dependencies
RUN --mount=type=bind,source=package.json,target=package.json \
    --mount=type=bind,source=package-lock.json,target=package-lock.json \
    --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

# Copy application files
COPY . .

# Create required directories and set proper permissions
RUN mkdir -p /usr/src/app \
    && chown -R node:node /usr/src/app

# Expose the email server port
EXPOSE 3001

# Switch to non-root user
USER node

# Start the email server
CMD ["npm", "run", "start"]
