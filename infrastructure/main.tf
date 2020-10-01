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

resource azurerm_key_vault_secret "idam_service_secret" {
  name = "microservicekey-ccd-gw"
  value = "${data.azurerm_key_vault_secret.idam_service_key.value}"
  key_vault_id = "${data.azurerm_key_vault.ccd_shared_key_vault.id}"
}
