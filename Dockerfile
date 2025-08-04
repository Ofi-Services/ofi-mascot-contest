FROM node:18-alpine

WORKDIR /app

# Create directories for persistent data
RUN mkdir -p /app/backend/data /app/backend/uploads

# Copy package files
COPY package*.json ./
COPY frontend/package*.json ./frontend/
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm run install:all

# Copy source files
COPY frontend/ ./frontend/
COPY backend/ ./backend/

# Build frontend
RUN npm run build

# Move frontend build to backend's public directory
RUN mkdir -p backend/public
RUN mv frontend/build/* backend/public/

EXPOSE 5000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=5000
ENV HOST=0.0.0.0

# Start the backend server
CMD ["npm", "run", "start"]
