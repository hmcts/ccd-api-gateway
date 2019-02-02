FROM node:8.12.0-slim

WORKDIR /usr/src/app

COPY package.json yarn.lock ./
RUN curl -o- -L https://yarnpkg.com/install.sh | bash -s \
    && export PATH="$HOME/.yarn/bin:$HOME/.config/yarn/global/node_modules/.bin:$PATH" \
    && yarn install --production \
    && yarn cache clean


COPY app.js server.js ./
COPY app ./app
COPY config ./config

ENV PORT 3453

HEALTHCHECK --interval=10s \
    --timeout=10s \
    --retries=10 \
    CMD http_proxy="" curl --silent --fail http://localhost:3453/health

EXPOSE 3453
CMD [ "yarn", "start" ]
