# --- Aurora DSQL (Postgres-compatible, IAM auth, no VPC) ---

resource "aws_dsql_cluster" "db" {
  deletion_protection_enabled = local.is_prod

  tags = {
    Name = "incorporadora-db-${local.env}"
  }
}

locals {
  dsql_endpoint = "${aws_dsql_cluster.db.identifier}.dsql.us-east-1.on.aws"
}

# --- Daily backups, kept 14 days (prod only; dev is refilled with make copy-prod-dev) ---

resource "aws_backup_vault" "db" {
  count = local.is_prod ? 1 : 0
  name  = "incorporadora-db-${local.env}"
}

resource "aws_backup_plan" "db" {
  count = local.is_prod ? 1 : 0
  name  = "incorporadora-db-${local.env}"

  rule {
    rule_name         = "daily-14d"
    target_vault_name = aws_backup_vault.db[0].name
    schedule          = "cron(0 6 * * ? *)" # 03:00 in Brazil

    lifecycle {
      delete_after = 14
    }
  }
}

resource "aws_iam_role" "backup" {
  count                = local.is_prod ? 1 : 0
  name                 = "incorporadora-backup-${local.env}"
  path                 = "/app/"
  permissions_boundary = "arn:aws:iam::${local.account_id}:policy/tito-boundary"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "backup.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "backup" {
  for_each = local.is_prod ? toset([
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup",
    "arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores",
  ]) : toset([])

  role       = aws_iam_role.backup[0].name
  policy_arn = each.value
}

resource "aws_backup_selection" "db" {
  count        = local.is_prod ? 1 : 0
  name         = "incorporadora-db-${local.env}"
  plan_id      = aws_backup_plan.db[0].id
  iam_role_arn = aws_iam_role.backup[0].arn
  resources    = [aws_dsql_cluster.db.arn]
}
