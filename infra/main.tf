# One stack per Terraform workspace: `dev` or `prod` (the Makefile sets TF_WORKSPACE).
# Every name includes the workspace, so the stacks share nothing.

data "aws_caller_identity" "current" {}

locals {
  env        = terraform.workspace
  is_prod    = local.env == "prod"
  domain     = local.is_prod ? "incorporadora.${var.zone_name}" : "${local.env}.incorporadora.${var.zone_name}"
  ssm_prefix = "/incorporadora/${local.env}"
  account_id = data.aws_caller_identity.current.account_id
  # Site record: dev at once, prod only after the cutover.
  create_dns = local.is_prod ? var.dns_cutover : true
}

resource "terraform_data" "workspace_guard" {
  lifecycle {
    precondition {
      condition     = contains(["dev", "prod"], terraform.workspace)
      error_message = "Select the dev or prod workspace (make plan dev|prod), not \"${terraform.workspace}\"."
    }
  }
}
