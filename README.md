# ccd-api-gateway
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Greenkeeper badge](https://badges.greenkeeper.io/hmcts/ccd-api-gateway.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/hmcts/ccd-api-gateway.svg?branch=master)](https://travis-ci.org/hmcts/ccd-api-gateway)
[![Docker Build Status](https://img.shields.io/docker/build/hmcts/ccd-api-gateway.svg)](https://hub.docker.com/r/hmcts/ccd-api-gateway)
[![codecov](https://codecov.io/gh/hmcts/ccd-api-gateway/branch/master/graph/badge.svg)](https://codecov.io/gh/hmcts/ccd-api-gateway)
[![Codacy Badge](https://api.codacy.com/project/badge/Grade/f3ab7a7b6b784e76bc23a020628729e5)](https://www.codacy.com/app/adr1ancho/ccd-api-gateway?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=hmcts/ccd-api-gateway&amp;utm_campaign=Badge_Grade)
[![Known Vulnerabilities](https://snyk.io/test/github/hmcts/ccd-api-gateway/badge.svg)](https://snyk.io/test/github/hmcts/ccd-api-gateway)
[![HitCount](http://hits.dwyl.io/hmcts/ccd-api-gateway.svg)](#ccd-api-gateway)
[![Issue Stats](http://issuestats.com/github/hmcts/ccd-api-gateway/badge/pr)](http://issuestats.com/github/hmcts/ccd-api-gateway)

Secured API Gateway integrating with IDAM

## Getting started

```bash
git clone https://github.com/hmcts/ccd-api-gateway.git
cd ccd-api-gateway
```

### Prerequisites

* [Node.js](https://nodejs.org/) >= v8.0.0
* [yarn](https://yarnpkg.com/)
* [Docker](https://www.docker.com)

#### Environment variables

The following environment variables are required:

| Name | Description |
|------|-------------|
| PROXY_AGGREGATED | Base URL of the aggregated API. `http://localhost:4452` for the dockerised local instance. |
| PROXY_DATA | Base URL of the Data Store API. `http://localhost:4452` for the dockerised local instance. |
| PROXY_DEFINITION_IMPORT | Base URL of the Definition Store API. `http://localhost:4451` for the dockerised local instance. |
| PROXY_DEFINITION_DATA | Base URL of the Definition Store API. `http://localhost:4451` for the dockerised local instance. |
| PROXY_DEFINITION_DISPLAY | Base URL of the Definition Store API. `http://localhost:4451` for the dockerised local instance. |
| PROXY_DOCUMENT_MANAGEMENT | Base URL of the remote Document Management API gateway. |
| PROXY_PRINT_SERVICE | Base URL of the CCD Case Data Print Service. `http://localhost:3100` for the dockerised local instance. |
| PROXY_CASE_ACTIVITY | Base URL of the CCD Case Activity API. `http://localhost:3460` for the non-dockerised local instance. |
| IDAM_USER_URL | Base URL for IdAM's User API service (idam-app). `http://localhost:4501` for the dockerised local instance or tunnelled `dev` instance. |
| IDAM_S2S_URL | Base URL for IdAM's S2S API service (service-auth-provider). `http://localhost:4502` for the dockerised local instance or tunnelled `dev` instance. |
| IDAM_SERVICE_KEY | API Gateway's IDAM S2S micro-service secret key. This must match the IDAM instance it's being run against. |
| IDAM_OAUTH2_LOGOUT_ENDPOINT | URL of the IdAM OAuth2 API `logout` endpoint. `http://localhost:4501/session/:token` for the dockerised local instance. |
| IDAM_OAUTH2_TOKEN_ENDPOINT | URL of the IdAM OAuth2 API endpoint for obtaining an OAuth2 token. `http://localhost:4501/oauth2/token` for the dockerised local instance or tunnelled `dev` instance. |
| IDAM_OAUTH2_CLIENT_SECRET | Secret to be passed to IdAM when obtaining an OAuth2 token. This must match the IdAM instance it's being run against. |
| ADDRESS_LOOKUP_TOKEN | Token for use with the MoJ Address Lookup service. |
| CORS_ORIGIN_WHITELIST | Comma-separated list of authorised origins for Cross-Origin requests. `http://localhost:3451,http://localhost:3452` for the local instances of CCD |
| APPINSIGHTS_INSTRUMENTATIONKEY | Secret for Microsoft Insights logging, can be a dummy string in local. |

### Install dependencies

The project uses [yarn](https://yarnpkg.com/).

To install dependencies please execute the following command:

```bash
yarn install
```

### Running

Simply run:

```
yarn start
```

to start the API gateway on [http://localhost:3453](http://localhost:3453).

#### Docker

If you want your code to become available to other Docker projects (e.g. for local environment testing), you need to build the image:

```bash
docker-compose build
```

You can run it by executing following command:

```bash
docker-compose up
```

As a result, the API gateway will be started and made available on port `3453`.

## Integration tests

The integration tests are mavenized and can be run using:

```bash
yarn integration
```
