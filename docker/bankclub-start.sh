#!/bin/sh
set -eu

# Bank Club owns both its Next.js site and the embedded property valuation app.
python3 /app/valuation/serve.py --bind 0.0.0.0 --port 5606 &
valuation_pid=$!

pnpm start --hostname 0.0.0.0 --port 3000 &
bankclub_pid=$!

shutdown() {
  kill "$bankclub_pid" "$valuation_pid" 2>/dev/null || true
  wait "$bankclub_pid" 2>/dev/null || true
  wait "$valuation_pid" 2>/dev/null || true
}

trap 'shutdown; exit 0' INT TERM

while kill -0 "$bankclub_pid" 2>/dev/null && kill -0 "$valuation_pid" 2>/dev/null; do
  sleep 2
done

shutdown
exit 1
