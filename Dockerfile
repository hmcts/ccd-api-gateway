ARG PLATFORM=""
FROM hmctspublic.azurecr.io/base/node${PLATFORM}:14-alpine as base

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

USER root
RUN apk update \
  && apk add bzip2 patch python3 py3-pip make gcc g++ \
  && rm -rf /var/lib/apt/lists/* \
  && export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

COPY . .
RUN chown -R hmcts:hmcts .

USER hmcts

COPY package.json yarn.lock ./

RUN yarn install --ignore-optional --network-timeout 1200000

# ---- Build Image ----
FROM base as build

RUN sleep 1 && yarn install --ignore-optional --production --network-timeout 1200000 && yarn cache clean

COPY app.js server.js ./
COPY app ./app
COPY config ./config

# Runtime image
FROM hmctspublic.azurecr.io/base/node${PLATFORM}:14-alpine as runtime

ENV PORT 3453
EXPOSE 3453
