output "bucket_name" {
  value = aws_s3_bucket.site.bucket
}

output "distribution_id" {
  value = aws_cloudfront_distribution.site.id
}

output "distribution_domain" {
  value = aws_cloudfront_distribution.site.domain_name
}

# Where to test: the real domain once its record exists, the cloudfront.net domain before.
output "url" {
  value = "https://${local.create_dns ? local.domain : aws_cloudfront_distribution.site.domain_name}"
}

output "dsql_endpoint" {
  value = local.dsql_endpoint
}

output "lambda_name" {
  value = aws_lambda_function.api.function_name
}
