# Keep hub.Dockerfile aligned to this file as far as possible
ARG base=hmctspublic.azurecr.io/base/node:12-stretch-slim

# Base image
FROM ${base} as base

COPY package.json yarn.lock ./
RUN yarn install --production \
    && yarn cache clean

COPY app.js server.js ./
COPY app ./app
COPY config ./config

# Runtime image
FROM base as runtime
ENV PORT 3453
HEALTHCHECK --interval=10s \
    --timeout=10s \
    --retries=10 \
    CMD http_proxy="" curl --silent --fail http://localhost:3453/health
EXPOSE 3453
