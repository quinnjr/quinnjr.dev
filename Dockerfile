# syntax=docker/dockerfile:1.3-labs
FROM node:lts-alpine as builder

ENV ENV=development
ENV NODE_ENV=development
ENV NODE_OPTIONS="--max-old-space-size=8192"

WORKDIR /app

COPY . .

RUN apk add --no-cache libc6-compat zlib zlib-dev optipng pkgconfig autoconf \
    automake nasm build-base libtool && \
  npm i -g npm pnpm && \
  pnpm install --no-optional --unsafe-perm && \
  pnpm run build:ssr

FROM node:lts-alpine

ENV ENV=production
ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder --chown=node:node /app/dist/quinnjr.tech/browser/ /app/dist/quinnjr.tech/browser
COPY --from=builder --chown=node:node /app/dist/quinnjr.tech/server/ /app/dist/quinnjr.tech/server
COPY --from=builder --chown=node:node /app/prisma/ /app/prisma/
COPY --from=builder --chown=node:node /app/package.json /app/package.json
COPY --from=builder --chown=node:node /app/angular.json /app/angular.json
COPY --from=builder --chown=node:node /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder --chown=node:node /app/docker-entry.sh /app/docker-entry.sh

RUN npm i -g npm pnpm && \
  pnpm install --no-optional && \
  pnpm install -g prisma && \
  pnpx prisma generate && \
  pnpm uninstall -g prisma && \
  chown -R node:node /app

USER node
EXPOSE 4200

ENTRYPOINT ["/app/docker-entry.sh"]
