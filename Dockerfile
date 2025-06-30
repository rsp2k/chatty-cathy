# Use the official Node.js 20 image (supports Astro 5)
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    libc6-compat

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose the port Astro uses
EXPOSE 4321

# Start the development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
