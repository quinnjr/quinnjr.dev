variable "AWS_ACCESS_KEY" {}
variable "AWS_SECRET_KEY" {}
variable "AWS_REGION" {
  type = string
  default = "us-east-1"
}
variable "ECS_AMIS" {
  type = map(string)

  default = {
    "us-east-1" = "ami-040d909ea4e56f8f3"
  }
}
variable "GH_USERNAME" {}
variable "GH_TOKEN" {}
variable "GH_RUNTIME_TOKEN" {}
