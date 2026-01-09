# Use a lightweight standard Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy the rest of the application code
COPY . .

# Create a non-root user (good security practice)
# Alpine images usually have a 'node' user built-in
USER node

# Expose the port
EXPOSE 5000

# Start the server
CMD ["node", "server.js"]
