# syntax=docker/dockerfile:1.3-labs
FROM node:lts-alpine as builder

ENV ENV=development
ENV NODE_ENV=development
ENV NODE_OPTIONS="--max-old-space-size=8192"

WORKDIR /app

RUN apk add --no-cache libc6-compat \
    zlib \
    zlib-dev \
    pkgconfig \
    autoconf \
    automake \
    nasm \
    build-base \
    libtool && \
  npm i -g npm

COPY ./package*.json /app/
COPY ./pnpm-lock.yaml /app/pnpm-lock.yaml

RUN npm install

COPY ./ .

RUN npx prisma generate

RUN npm run build:ssr

FROM node:lts-alpine

ENV ENV=production
ENV NODE_ENV=production

RUN npm i -g npm && \
  npm i -g pnpm && \
  mkdir /app && \
  mkdir -p /app/node_modules && \
  chown -R node:node /app

WORKDIR /app
USER node

COPY --from=builder --chown=node:node /app/dist/quinnjr.tech/browser/ /app/dist/quinnjr.tech/browser
COPY --from=builder --chown=node:node /app/dist/quinnjr.tech/server/ /app/dist/quinnjr.tech/server
COPY --from=builder --chown=node:node /app/prisma/ /app/prisma/
COPY --from=builder --chown=node:node /app/package*.json /app/
COPY --from=builder --chown=node:node /app/angular.json /app/angular.json
COPY --from=builder --chown=node:node /app/pnpm-lock.yaml /app/pnpm-lock.yaml
COPY --from=builder --chown=node:node /app/docker-entry.sh /app/docker-entry.sh
COPY --from=builder --chown=node:node /app/node_modules/.prisma /app/node_modules/.prisma
COPY --from=builder --chown=node:node /app/node_modules/@prisma /app/node_modules/@prisma
COPY --from=builder --chown=node:node /app/node_modules/prisma /app/node_modules/prisma

RUN pnpm install --prod

EXPOSE 4200

ENTRYPOINT ["npm", "run", "serve:ssr"]
