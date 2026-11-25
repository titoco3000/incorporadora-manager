data "aws_route53_zone" "zone" {
  name = var.zone_name
}

# --- Certificate (created at once for both stacks; only validation records go into DNS) ---

resource "aws_acm_certificate" "site" {
  domain_name       = local.domain
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_route53_record" "cert_validation" {
  for_each = {
    for dvo in aws_acm_certificate.site.domain_validation_options : dvo.domain_name => dvo
  }

  zone_id         = data.aws_route53_zone.zone.zone_id
  name            = each.value.resource_record_name
  type            = each.value.resource_record_type
  records         = [each.value.resource_record_value]
  ttl             = 300
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "site" {
  certificate_arn         = aws_acm_certificate.site.arn
  validation_record_fqdns = [for r in aws_route53_record.cert_validation : r.fqdn]
}

# --- Site record: dev always, prod only after dns_cutover = true. Don't open the domain before
# it exists: a "no such name" answer gets cached for up to a day. ---

resource "aws_route53_record" "alias" {
  for_each = local.create_dns ? toset(["A", "AAAA"]) : toset([])

  zone_id = data.aws_route53_zone.zone.zone_id
  name    = local.domain
  type    = each.value

  alias {
    name                   = aws_cloudfront_distribution.site.domain_name
    zone_id                = aws_cloudfront_distribution.site.hosted_zone_id
    evaluate_target_health = false
  }
}
