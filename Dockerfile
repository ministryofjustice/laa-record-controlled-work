FROM node:25.8.2-alpine AS base

###########################################
FROM base AS builder

WORKDIR /app

# Required to resolve lodash via GitHub SHA until lodash@4.18.0 is published to npm
RUN apk add --no-cache git

# Enable Corepack so it picks up the yarn version from the packageManager field in package.json
RUN npm install -g --force corepack && corepack enable

COPY package*.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# Uses .dockerignore for filtering
COPY . .
RUN yarn build

# Yarn 4 has no production-only install mode outside of workspaces, so use npm to prune devDependencies.
# --legacy-peer-deps is required because npm's peer dependency resolver is stricter than Yarn's and 
# cannot reconcile the Yarn-installed node_modules.
RUN npm prune --omit=dev --legacy-peer-deps

###########################################
FROM base AS runner

WORKDIR /app

RUN apk update && apk upgrade --no-cache

RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -G appuser -S appuser

COPY --from=builder --chown=1001:1001 /app/public ./public
COPY --from=builder --chown=1001:1001 /app/views ./views
COPY --from=builder --chown=1001:1001 /app/locales ./locales
COPY --from=builder --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /app/package.json ./package.json

# Run as non-root
USER 1001

EXPOSE 3000
CMD ["node", "public/app.js"]
