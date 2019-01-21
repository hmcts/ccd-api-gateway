output "api_gateway_web_deployment_endpoint" {
  value = "${module.api-gateway-web.gitendpoint}"
}

output "vaultName" {
  value = "${local.vaultName}"
}
