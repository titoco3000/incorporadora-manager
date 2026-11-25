# --- Secret (value set by hand, never in state or git; see MIGRATION.md step 3.4) ---

resource "aws_ssm_parameter" "jwt_secret" {
  name  = "${local.ssm_prefix}/jwt-secret"
  type  = "SecureString"
  value = "placeholder"

  lifecycle {
    ignore_changes = [value]
  }
}

# --- Lambda (Hono API, bundled by `make build-api`) ---

data "archive_file" "api" {
  type        = "zip"
  source_file = "${path.module}/../api/dist/index.mjs"
  output_path = "${path.module}/.terraform/api-${local.env}.zip"
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/aws/lambda/incorporadora-api-${local.env}"
  retention_in_days = 14
}

resource "aws_iam_role" "api" {
  name                 = "incorporadora-api-${local.env}"
  path                 = "/app/"
  permissions_boundary = "arn:aws:iam::${local.account_id}:policy/tito-boundary"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "api" {
  name = "api"
  role = aws_iam_role.api.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "${aws_cloudwatch_log_group.api.arn}:*"
      },
      {
        Effect   = "Allow"
        Action   = "dsql:DbConnectAdmin"
        Resource = aws_dsql_cluster.db.arn
      },
      {
        Effect   = "Allow"
        Action   = "ssm:GetParameter"
        Resource = aws_ssm_parameter.jwt_secret.arn
      }
    ]
  })
}

resource "aws_lambda_function" "api" {
  function_name    = "incorporadora-api-${local.env}"
  role             = aws_iam_role.api.arn
  runtime          = "nodejs24.x"
  architectures    = ["arm64"]
  handler          = "index.handler"
  memory_size      = 512 # bcrypt is CPU-bound; CPU scales with memory
  timeout          = 15
  filename         = data.archive_file.api.output_path
  source_code_hash = data.archive_file.api.output_base64sha256

  environment {
    variables = {
      DSQL_ENDPOINT = local.dsql_endpoint
      SSM_PREFIX    = local.ssm_prefix
    }
  }

  depends_on = [aws_cloudwatch_log_group.api, aws_iam_role_policy.api]
}

# Only reachable through CloudFront, which signs requests (OAC).
resource "aws_lambda_function_url" "api" {
  function_name      = aws_lambda_function.api.function_name
  authorization_type = "AWS_IAM"
}

locals {
  api_domain = regex("^https://([^/]+)/?$", aws_lambda_function_url.api.function_url)[0]
}

resource "aws_cloudfront_origin_access_control" "api" {
  name                              = "incorporadora-api-${local.env}"
  origin_access_control_origin_type = "lambda"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_lambda_permission" "cloudfront_url" {
  statement_id           = "CloudFrontInvokeFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.api.function_name
  principal              = "cloudfront.amazonaws.com"
  source_arn             = aws_cloudfront_distribution.site.arn
  function_url_auth_type = "AWS_IAM"
}

resource "aws_lambda_permission" "cloudfront_invoke" {
  statement_id  = "CloudFrontInvokeFunction"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api.function_name
  principal     = "cloudfront.amazonaws.com"
  source_arn    = aws_cloudfront_distribution.site.arn
}
