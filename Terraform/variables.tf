variable "aws_region" {
  type = string
}

variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "vpc_cidr" {
  type = string
}

variable "db_name" {
  type    = string
  default = "academydev"
}

variable "db_username" {
  type    = string
  default = "academyadmin"
}

variable "container_image_tag" {
  type    = string
  default = "latest"
}

variable "backend_container_port" {
  type    = number
  default = 5000
}

variable "frontend_container_port" {
  type    = number
  default = 3000
}

variable "admin_container_port" {
  type    = number
  default = 3000
}

variable "email_user" {
  type      = string
  sensitive = true
  default   = ""
}

variable "email_pass" {
  type      = string
  sensitive = true
  default   = ""
}

variable "gemini_api_key" {
  type      = string
  sensitive = true
  default   = ""
}
