#!/usr/bin/env bash

trap 'kill $(jobs -p) 2>/dev/null' EXIT

cd "$(dirname "$0")"

(cd server && npm run dev) &
(cd client && npm run dev) &

wait
