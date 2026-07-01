FROM python:3.12-alpine

WORKDIR /app

COPY backend ./backend
COPY apps/backadmin ./apps/backadmin
COPY admin.html site-config.json ./
COPY assets ./assets
COPY data ./data

ENV BACKADMIN_HOST=0.0.0.0
ENV BACKADMIN_PORT=8788
ENV TFSE_DB_PATH=/data/tfse.sqlite3
ENV BACKADMIN_STATIC_ROOT=/app

VOLUME ["/data"]
EXPOSE 8788

CMD ["python", "apps/backadmin/server.py"]
