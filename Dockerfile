# Keep hub.Dockerfile aligned to this file as far as possible

# Base image
FROM hmctspublic.azurecr.io/base/node:14-alpine as base

USER hmcts

COPY package.json yarn.lock ./
RUN yarn install --production \
    && yarn cache clean

COPY app.js server.js ./
COPY app ./app
COPY config ./config

# Runtime image
FROM base as runtime
ENV PORT 3453
EXPOSE 3453
