FROM node:26.1.0-alpine@sha256:51b507afc2ba5a8209413bc46c93e3929da14ae6444c647b1aae873601a6580a AS base

###########################################
FROM base AS installer

WORKDIR /app

# Enable Corepack so it picks up the yarn version from the packageManager field in package.json
# Remove yarn/yarnpkg shims pre-installed by the base image to avoid conflicts when installing corepack
RUN rm -f /usr/local/bin/yarn /usr/local/bin/yarnpkg &&\
    npm install -g corepack &&\
    corepack enable

COPY package*.json yarn.lock .yarnrc.yml ./
RUN yarn install --immutable

# Uses .dockerignore for filtering
COPY . .

###########################################
FROM installer AS builder

RUN yarn build

# Yarn 4 has no production-only install mode outside of workspaces, so use npm to prune devDependencies.
# --legacy-peer-deps is required because npm's peer dependency resolver is stricter than Yarn's and 
# cannot reconcile the Yarn-installed node_modules.
RUN npm prune --omit=dev --legacy-peer-deps

###########################################
FROM installer AS dev

EXPOSE 3000
CMD ["yarn", "watch"]

###########################################
FROM base AS runner

WORKDIR /app

RUN apk update && apk upgrade --no-cache

# npm is not needed at runtime; remove it to eliminate its bundled vulnerabilities from the image
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -G appuser -S appuser

COPY --from=builder --chown=1001:1001 /app/public ./public
COPY --from=builder --chown=1001:1001 /app/locales ./locales
COPY --from=builder --chown=1001:1001 /app/node_modules ./node_modules
COPY --from=builder --chown=1001:1001 /app/package.json ./package.json

# Run as non-root
USER 1001

EXPOSE 3000
CMD ["node", "public/app.js"]
