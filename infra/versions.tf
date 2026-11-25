terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Local state, one file per workspace in infra/terraform.tfstate.d/<env>/, committed to git.
}

provider "aws" {
  region  = "us-east-1" # CloudFront certificates must be in us-east-1
  profile = var.aws_profile

  default_tags {
    tags = {
      Project   = "incorporadora"
      Stage     = local.env
      ManagedBy = "terraform"
    }
  }
}
