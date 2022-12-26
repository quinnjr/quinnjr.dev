terraform {
  required_version = ">= 1.2"
  required_providers {
    aws = {
      source = "hashicorp/aws"
      version = "~> 4.0"
    }

    random = {
      source = "hashicorp/random"
      version = "~> 3.3"
    }
  }

  backend "s3" {
    bucket = "quinnjr-tech"
    key = "terraform/quinnjr-tech"
    region = "us-east-1"
    encrypt = true
    dynamodb_table = "ecs-terraform-remote-state-dynamodb"
  }
}
