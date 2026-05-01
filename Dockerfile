# Stage 1: Build Frontend
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
ARG VITE_WEBHOOK_SECRET
ENV VITE_WEBHOOK_SECRET=$VITE_WEBHOOK_SECRET
RUN npm run build

# Stage 2: Runner
FROM node:20-alpine AS runner

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy the built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy the backend server file
COPY server.js ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start the Express server which serves the frontend and handling API
CMD ["node", "server.js"]
