# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN apt-get update -y && apt-get install -y --no-install-recommends ca-certificates \
  && rm -rf /var/lib/apt/lists/* \
  && groupadd --system --gid 1001 svc \
  && useradd --system --uid 1001 --gid svc --home-dir /nonexistent --shell /usr/sbin/nologin svc

COPY package.json ./
COPY server.mjs ./

RUN npm install --omit=dev && npm cache clean --force \
  && chown -R svc:svc /app

USER svc

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT||4000) + '/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "server.mjs"]
