# syntax=docker/dockerfile:1.3-labs
FROM node:lts-alpine as builder

WORKDIR /app

ENV NODE_OPTIONS="--max-old-space-size=8192"

COPY . .

RUN <<EOF
  apk --no-cache add libc6-compat pkgconfig autoconf automake build-base sudo gawk make musl-dev gcc libtool nasm
  npm i -g npm pnpm @angular/cli
  chown -R node:node /app
  echo 'node ALL=(ALL:ALL) NOPASSWD: ALL' >> /etc/sudoers
EOF

USER node
EXPOSE 4200

ENTRYPOINT ["/app/docker-entry.sh"]
