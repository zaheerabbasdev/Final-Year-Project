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

variable "ecs_cpu" {
  type    = string
  default = "2048"
}

variable "ecs_memory" {
  type    = string
  default = "2048"
}

variable "ecs_desired_count" {
  type    = number
  default = 1
}

variable "ecs_min_count" {
  type    = number
  default = 1
}

variable "ecs_max_count" {
  type    = number
  default = 4
}

variable "ecs_target_cpu_utilization" {
  type    = number
  default = 50
}

variable "notification_email" {
  type    = string
  default = ""
}

variable "alarm_period" {
  type    = number
  default = 60
}

variable "alarm_evaluation_periods" {
  type    = number
  default = 1
}

variable "alarm_threshold" {
  type    = number
  default = 1
}