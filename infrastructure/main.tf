provider "azurerm" {
  version = "1.22.1"
}

locals {
  // S2S
  s2s_url = "http://rpe-service-auth-provider-${var.env}.service.${var.env}.internal"

  // Vault name
  vaultName = "${var.raw_product}-${var.env}"

  // Shared Resource Group
  sharedResourceGroup = "${var.raw_product}-shared-${var.env}"

}

data "azurerm_key_vault" "ccd_shared_key_vault" {
  name = "${local.vaultName}"
  resource_group_name = "${local.sharedResourceGroup}"
}

data "azurerm_key_vault" "s2s_vault" {
  name = "s2s-${var.env}"
  resource_group_name = "rpe-service-auth-provider-${var.env}"
}

data "azurerm_key_vault_secret" "idam_service_key" {
  name = "microservicekey-ccd-gw"
  key_vault_id = "${data.azurerm_key_vault.s2s_vault.id}"
}

module "api-gateway-web" {
  source = "git@github.com:hmcts/cnp-module-webapp?ref=master"
  product = "${var.product}-${var.component}"
  location = "${var.location}"
  appinsights_location = "${var.location}"
  env = "${var.env}"
  ilbIp = "${var.ilbIp}"
  subscription = "${var.subscription}"
  is_frontend = "${local.is_frontend}"
  additional_host_name = "${local.external_host_name}"
  https_only = "${var.https_only}"
  common_tags  = "${var.common_tags}"
  asp_name = "${(var.asp_name == "use_shared") ? local.sharedAppServicePlan : var.asp_name}"
  asp_rg = "${(var.asp_rg == "use_shared") ? local.sharedASPResourceGroup : var.asp_rg}"
  website_local_cache_sizeinmb = 800
  capacity = "${var.capacity}"
  appinsights_instrumentation_key = "${var.appinsights_instrumentation_key}"

  app_settings = {
    IDAM_OAUTH2_TOKEN_ENDPOINT = "${var.idam_api_url}/oauth2/token"
    IDAM_OAUTH2_CLIENT_ID = "ccd_gateway"
    IDAM_OAUTH2_CLIENT_SECRET = "${data.azurerm_key_vault_secret.oauth2_client_secret.value}"
    IDAM_OAUTH2_LOGOUT_ENDPOINT = "${var.idam_api_url}/session/:token"
    ADDRESS_LOOKUP_TOKEN = "${data.azurerm_key_vault_secret.address_lookup_token.value}"
    CORS_ORIGIN_METHODS = "GET,POST,OPTIONS,PUT,DELETE"
    CORS_ORIGIN_WHITELIST = "${local.default_cors_origin},${local.cors_origin}"
    IDAM_BASE_URL = "${var.idam_api_url}"
    IDAM_S2S_URL = "${local.s2s_url}"
    IDAM_SERVICE_KEY = "${data.azurerm_key_vault_secret.idam_service_key.value}"
    IDAM_SERVICE_NAME = "ccd_gw"
    PROXY_AGGREGATED = "http://ccd-data-store-api-${local.env_ase_url}"
    PROXY_CASE_ACTIVITY = "http://ccd-case-activity-api-${local.env_ase_url}"
    PROXY_DATA = "http://ccd-data-store-api-${local.env_ase_url}"
    PROXY_DEFINITION_IMPORT = "http://ccd-definition-store-api-${local.env_ase_url}"
    PROXY_DOCUMENT_MANAGEMENT = "${local.document_management_url}"
    PROXY_PRINT_SERVICE = "${local.ccd_print_service_url}"
    PROXY_PAYMENTS = "${local.payments_url}"
    PROXY_REFDATA = "${local.refdata_url}"
    SECURE_AUTH_COOKIE_ENABLED = "true"
    TIMING-ALLOW-ORIGIN = "A,B,C"
    DUMMY_VAR = "true"
  }
resource azurerm_key_vault_secret "idam_service_secret" {
  name = "microservicekey-ccd-gw"
  value = "${data.azurerm_key_vault_secret.idam_service_key.value}"
  key_vault_id = "${data.azurerm_key_vault.ccd_shared_key_vault.id}"
}
