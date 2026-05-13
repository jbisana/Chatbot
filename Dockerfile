# Stage 1: Build
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies, caching them unless package files change
RUN npm install

# Copy source code
COPY . .

# Build the Vite React application
RUN npm run build

# Stage 2: Serve
FROM node:20-alpine AS runner

# Set working directory
WORKDIR /app

# Install 'serve' package globally to serve static files
RUN npm install -g serve

# Copy only the built assets from the builder stage
COPY --from=builder /app/dist ./dist

# Optimize Node environment
ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# Start a lightweight static file server
CMD ["serve", "-s", "dist", "-l", "3000"]
