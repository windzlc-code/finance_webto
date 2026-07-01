FROM node:22-alpine AS deps

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
COPY bank-club-site/package.json bank-club-site/pnpm-lock.yaml bank-club-site/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS runtime

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
ENV NODE_ENV=production
ENV BANKCLUB_BASE_PATH=/bankclub
COPY --from=deps /app/node_modules ./node_modules
COPY bank-club-site ./
RUN pnpm build

EXPOSE 3000
CMD ["pnpm", "start", "--hostname", "0.0.0.0", "--port", "3000"]
