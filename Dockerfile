ARG PLATFORM=""
FROM hmctspublic.azurecr.io/base/node${PLATFORM}:18-alpine AS base

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV NODE_OPTIONS=--openssl-legacy-provider

USER root
RUN corepack enable
COPY --chown=hmcts:hmcts . .

USER hmcts
RUN yarn workspaces focus --all --production && rm -rf $(yarn cache clean)

# ---- Build Image ----
FROM base AS build

USER root

RUN apk update \
  && apk add bzip2 patch python3 py3-pip make gcc g++ \
  && rm -rf /var/lib/apt/lists/* \
  && export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH"

USER hmcts

RUN sleep 1 && yarn install && yarn cache clean

COPY --chown=hmcts:hmcts package.json yarn.lock ./


# ---- Runtime Image ----
FROM hmctspublic.azurecr.io/base/node${PLATFORM}:18-alpine AS runtime
COPY --from=build $WORKDIR .

ENV PORT=3453
EXPOSE 3453
