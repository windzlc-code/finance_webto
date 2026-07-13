FROM node:22-alpine AS deps

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
COPY bank-club-site/package.json bank-club-site/pnpm-lock.yaml bank-club-site/pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

FROM node:22-alpine AS runtime

WORKDIR /app
RUN corepack enable && corepack prepare pnpm@11.7.0 --activate
RUN apk add --no-cache python3
ENV NODE_ENV=production
ENV BANKCLUB_BASE_PATH=
COPY --from=deps /app/node_modules ./node_modules
COPY bank-club-site ./
COPY docker/bankclub-start.sh /usr/local/bin/bankclub-start
RUN chmod +x /usr/local/bin/bankclub-start
RUN pnpm build

EXPOSE 3000
EXPOSE 5606
CMD ["/usr/local/bin/bankclub-start"]
