ARG PLATFORM=""
FROM hmctspublic.azurecr.io/base/node${PLATFORM}:18-alpine as base

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_OPTIONS=--openssl-legacy-provider

USER root
RUN corepack enable
RUN apk update \
  && apk add bzip2 patch python3 py3-pip make gcc g++ \
  && rm -rf /var/lib/apt/lists/* \
  && export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

COPY --chown=hmcts:hmcts package.json yarn.lock ./

USER hmcts
COPY app.js server.js ./
COPY app ./app
COPY config ./config


RUN yarn install && yarn cache clean

# ---- Build Image ----
FROM base as build

RUN sleep 1 && yarn install && yarn cache clean

# Runtime image
FROM hmctspublic.azurecr.io/base/node${PLATFORM}:18-alpine as runtime

COPY --from=build $WORKDIR .

ENV PORT 3453
EXPOSE 3453
