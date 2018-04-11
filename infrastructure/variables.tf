variable "product" {
  type = "string"
}

variable "component" {
  type = "string"
}

variable "location" {
  type                  = "string"
  default               = "UK South"
}

variable "env" {
  type                  = "string"
  description           = "(Required) The environment in which to deploy the application infrastructure."
}

variable "ilbIp" {}

variable "subscription" {}

variable "vault_section" {
  default = "test"
}

variable "external_host_name" {
  default = "gateway-ccd.nonprod.platform.hmcts.net"
}

variable "idam_api_url" {
  default = "http://betaDevBccidamAppLB.reform.hmcts.net"
}

variable "idam_authentication_web_url" {
  default = "https://idam-test.dev.ccidam.reform.hmcts.net"
}

variable "s2s_url" {
  default = "http://betaDevBccidamS2SLB.reform.hmcts.net"
}

variable "cors_origin" {
  default = "https://www-ccd.nonprod.platform.hmcts.net"
}

variable "document_management_url" {
  default = "https://api-gateway.test.dm.reform.hmcts.net"
}

variable "ccd_print_service_url" {
  default = "https://return-case-doc-ccd.nonprod.platform.hmcts.net"
}
