FROM ghcr.io/puppeteer/puppeteer:latest

# Switch to root to allow file copying and permission changes
USER root

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install dependencies
# This ensures all node_modules are installed
RUN npm ci

# Copy the rest of the application code
COPY . .

# Change ownership of the app directory to the 'pptruser' user provided by the base image
RUN chown -R pptruser:node /app

# Switch back to the non-root user for security
USER pptruser

# Expose the port (Render will override PORT env var, but this documents intent)
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
