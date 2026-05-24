FROM node:22-alpine

WORKDIR /app

# Copy all workspace manifests so npm ci resolves the full lockfile
COPY package.json package-lock.json ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY apps/api/package.json ./apps/api/
COPY apps/admin-web/package.json ./apps/admin-web/

RUN npm ci

# Copy tsconfig and source for the packages we actually build
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY apps/api ./apps/api

RUN npm run build -w @crewith/api

WORKDIR /app/apps/api

CMD ["node", "dist/main.js"]
