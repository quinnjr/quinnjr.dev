#!/usr/bin/env sh

if [[ $ENV = "production" ]]; then
  pnpm run serve:ssr
else
  pnpm install --no-optional  --strict-peer-dependencies false
  pnpm run dev:ssr
fi
