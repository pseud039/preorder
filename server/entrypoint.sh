#!/bin/sh
set -e

if [ "$(id -u)" = "0" ]; then
  echo "Fixing permissions on upload directory..."
  chown -R node:node /usr/src/app/public/temp

  echo "Running migrations..."
  su-exec node npx prisma migrate deploy

  echo "Starting app..."
  exec su-exec node "$@"
fi

# Already non-root
# echo "Running migrations..."
# npx prisma migrate deploy

echo "Starting app..."
exec "$@"
