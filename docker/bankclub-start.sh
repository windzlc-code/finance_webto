#!/bin/sh
set -eu

exec pnpm start --hostname 0.0.0.0 --port 3000
