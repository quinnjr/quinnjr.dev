#!/usr/bin/env sh

if [[ $ENV = "production" ]]; then
  npm run serve:ssr
else
  npm install
  npm run dev:ssr
fi
