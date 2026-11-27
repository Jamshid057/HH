#!/bin/sh
set -e
python manage.py migrate --noinput
exec gunicorn root.wsgi:application \
  --bind 0.0.0.0:8000 \
  --workers "${WEB_CONCURRENCY:-3}" \
  --access-logfile - \
  --error-logfile -
