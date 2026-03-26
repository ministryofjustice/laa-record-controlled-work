# Use the official Node.js image as the base image
FROM node:25.8.2-alpine

# Set the working directory inside the container
WORKDIR /app

# Update any vulnerable Alpine packages
RUN apk update && apk upgrade --no-cache

# Install Corepack and prepare Yarn version and removed npm to avoid vunerablity bundling
RUN npm install -g --force corepack && \
    corepack enable && \
    corepack prepare yarn@4.9.2 --activate && \
    rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx 

# Copy package.json and yarn.lock to the working directory
COPY package*.json yarn.lock .yarnrc.yml ./

# Install dependencies
RUN yarn install --immutable

# Create a non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -G appuser -S appuser

# Copy the rest of the application code to the working directory
# and set ownership to the non-root user
COPY --chown=1001:1001 . .

# Build the application
RUN yarn build

# Set ownership of all generated files to the non-root user
RUN chown -R 1001:1001 /app

# Switch to the non-root user by ID (not name)
USER 1001

# Set HOME environment variable to fix corepack cache issues
ENV HOME=/app

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["node", "public/app.js"]
