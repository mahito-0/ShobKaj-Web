FROM node:18-alpine

WORKDIR /app

# Install server deps
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --only=prod

# Copy source
COPY server ./server
COPY public ./public

# Create runtime dirs
RUN mkdir -p /app/public/uploads && mkdir -p /app/data

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "server/server.js"]