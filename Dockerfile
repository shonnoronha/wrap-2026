# Wrap app + API server in one small image. The server has no npm dependencies
# (Node built-ins only), so the image just needs the built web app and the server code.
#
#   npm run docker:build          builds dist/ and the stored wraps on the host, then the image
#   docker run -d --name wrap-2026 -p 3000:3000 --env-file .env wrap-2026
#
# .env holds WRAP_DATA_API_URL / WRAP_DATA_API_TOKEN and is never baked into the image.

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production HOST=0.0.0.0 API_PORT=3000 LATENCY_MS=0
COPY package.json ./
COPY dist ./dist
COPY server ./server
COPY contract ./contract
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:3000/api/v1/health || exit 1
CMD ["node", "server/index.mjs"]
