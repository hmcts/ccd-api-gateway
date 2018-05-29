provider "vault" {
  address = "https://vault.reform.hmcts.net:6200"
}

locals {
  app_full_name = "${var.product}-${var.component}"
  env_ase_url = "${var.env}.service.${data.terraform_remote_state.core_apps_compute.ase_name[0]}.internal"

  default_cors_origin = "https://ccd-case-management-web-${local.env_ase_url}"
  default_document_management_url = "http://dm-store-${local.env_ase_url}"

  is_frontend = "${var.external_host_name != "" ? "1" : "0"}"
  external_host_name = "${var.external_host_name != "" ? var.external_host_name : "null"}"

  cors_origin = "${var.cors_origin != "" ? var.cors_origin : local.default_cors_origin}"
  ccd_print_service_url = "http://ccd-case-print-service-${local.env_ase_url}"
  document_management_url = "${var.document_management_url != "" ? var.document_management_url : local.default_document_management_url}"

  // S2S
  s2s_url = "http://rpe-service-auth-provider-${local.env_ase_url}"
}

data "vault_generic_secret" "address_lookup_token" {
  path = "secret/${var.vault_section}/ccd/postcode-info/token"
}

data "vault_generic_secret" "oauth2_client_secret" {
  path = "secret/${var.vault_section}/ccidam/idam-api/oauth2/client-secrets/ccd-gateway"
}

data "vault_generic_secret" "idam_service_key" {
  path = "secret/${var.vault_section}/ccidam/service-auth-provider/api/microservice-keys/ccd-gw"
}

module "api-gateway-web" {
  source = "git@github.com:hmcts/moj-module-webapp?ref=master"
  product = "${local.app_full_name}"
  location = "${var.location}"
  env = "${var.env}"
  ilbIp = "${var.ilbIp}"
  subscription = "${var.subscription}"
  is_frontend = "${local.is_frontend}"
  additional_host_name = "${local.external_host_name}"

  app_settings = {
    IDAM_OAUTH2_TOKEN_ENDPOINT = "${var.idam_api_url}/oauth2/token"
    IDAM_OAUTH2_CLIENT_ID = "ccd_gateway"
    IDAM_OAUTH2_CLIENT_SECRET = "${data.vault_generic_secret.oauth2_client_secret.data["value"]}"
    IDAM_OAUTH2_LOGOUT_ENDPOINT = "${var.idam_api_url}/session/:token"
    ADDRESS_LOOKUP_TOKEN = "${data.vault_generic_secret.address_lookup_token.data["value"]}"
    CORS_ORIGIN_METHODS = "GET,POST,OPTIONS"
    CORS_ORIGIN_WHITELIST = "https://ccd-case-management-web-${local.env_ase_url},${local.cors_origin}"
    IDAM_BASE_URL = "${var.idam_api_url}"
    IDAM_S2S_URL = "${local.s2s_url}"
    IDAM_SERVICE_KEY = "${data.vault_generic_secret.idam_service_key.data["value"]}"
    IDAM_SERVICE_NAME = "ccd_gw"
    PROXY_AGGREGATED = "http://ccd-data-store-api-${local.env_ase_url}"
    PROXY_CASE_ACTIVITY = "http://ccd-case-activity-api-${local.env_ase_url}"
    PROXY_DATA = "http://ccd-data-store-api-${local.env_ase_url}"
    PROXY_DEFINITION_IMPORT = "http://ccd-definition-store-api-${local.env_ase_url}"
    PROXY_DOCUMENT_MANAGEMENT = "${local.document_management_url}"
    PROXY_PRINT_SERVICE = "${local.ccd_print_service_url}"
    WEBSITE_NODE_DEFAULT_VERSION = "8.9.4"
  }
}
