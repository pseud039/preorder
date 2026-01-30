#!/bin/sh
set -e

# If running as root, fix volume permissions then drop privileges
if [ "$(id -u)" = "0" ]; then
  echo "Fixing permissions on upload directory..."
  chown -R node:node /usr/src/app/public/temp

  exec su-exec node "$@"
fi

exec "npx prisma migrate deploy"

# Already non-root
exec "$@"
