variable "aws_profile" {
  type    = string
  default = "personal"
}

variable "zone_name" {
  type    = string
  default = "titoco.dev"
}

variable "dns_cutover" {
  description = "prod only: create the A/AAAA records for incorporadora.titoco.dev. Keep false until prod was tested on its cloudfront.net domain and the data is final (MIGRATION.md step 5). dev always gets its record."
  type        = bool
  default     = true
}
