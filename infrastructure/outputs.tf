output "api_gateway_web_deployment_endpoint" {
  value = "${module.api-gateway-web.gitendpoint}"
}

output "vaultUri" {
  value = "${data.azurerm_key_vault.ccd_shared_key_vault.vault_uri}"
}

output "vaultName" {
  value = "${local.vaultName}"
}
