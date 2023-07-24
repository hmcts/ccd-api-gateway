# ---- Base image ----
ARG PLATFORM=""
FROM hmctspublic.azurecr.io/base/node${PLATFORM}:16-alpine as base

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV YARN_CACHE_FOLDER=~/npm-packages-offline-cache
ENV WORKDIR /opt/app
WORKDIR ${WORKDIR}

USER root
RUN corepack enable
USER hmcts

COPY --chown=hmcts:hmcts . .

RUN yarn install && yarn cache clean

# ---- Build Image ----
FROM base as build

# ---- Runtime image ----
FROM base as runtime

COPY --from=build $WORKDIR .

ENV PORT 3453
EXPOSE 3453
