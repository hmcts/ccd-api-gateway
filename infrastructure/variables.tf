variable "product" {
}

variable "raw_product" {
  default = "ccd" // jenkins-library overrides product for PRs and adds e.g. pr-118-ccd
}

variable "component" {
}

variable "env" {
  description = "(Required) The environment in which to deploy the application infrastructure."
}
