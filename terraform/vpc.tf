data "aws_availability_zones" "available" {}

resource "aws_vpc" "default" {
  cidr_block = "172.31.0.0/16"
  enable_classiclink = false
  enable_dns_hostnames = true
  enable_dns_support = true
  instance_tenancy = "default"
  assign_generated_ipv6_cidr_block = false

  tags = {
    "Name" = "default"
  }
}

resource "aws_subnet" "default-1" {
  assign_ipv6_address_on_creation = false
  availability_zone = "us-east-1a"
  cidr_block = "172.31.32.0/20"
  enable_dns64 = false
  enable_resource_name_dns_a_record_on_launch = false
  enable_resource_name_dns_aaaa_record_on_launch = false
  ipv6_native =  false
  map_public_ip_on_launch = true
  private_dns_hostname_type_on_launch = "ip-name"
  vpc_id = aws_vpc.default.id

  tags = {
    Name = "default-subnet-1"
  }
}

resource "aws_subnet" "default-2" {
  assign_ipv6_address_on_creation = false
  availability_zone = "us-east-1b"
  cidr_block = "172.31.16.0/20"
  enable_dns64 = false
  enable_resource_name_dns_a_record_on_launch = false
  enable_resource_name_dns_aaaa_record_on_launch = false
  ipv6_native = false
  map_public_ip_on_launch = true
  private_dns_hostname_type_on_launch = "ip-name"
  vpc_id = aws_vpc.default.id

  tags = {
    Name = "default-subnet-2"
  }

}

resource "aws_vpc" "main" {
  cidr_block = "10.0.0.0/16"
  enable_classiclink = false
  enable_dns_hostnames = true
  enable_dns_support = true

  tags = {
    "Name" = "main"
  }
}

resource "aws_subnet" "main-public" {
  count = 2
  vpc_id = aws_vpc.main.id
  cidr_block = cidrsubnet(aws_vpc.main.cidr_block, 8, count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "main-public-${count.index}"
  }
}

resource "aws_subnet" "main-private" {
  count = 2
  vpc_id = aws_vpc.main.id
  cidr_block = cidrsubnet(aws_vpc.main.cidr_block, 8, 2 + count.index)
  availability_zone = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = false

  tags = {
    Name = "main-private-${count.index}"
  }
}

resource "aws_internet_gateway" "main-gw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "main-gw"
  }
}

resource "aws_route_table" "main-public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main-gw.id
  }

  tags = {
    Name = "main-public-rt"
  }
}

resource "aws_route_table_association" "main-public" {
  count = 2
  subnet_id = aws_subnet.main-public[count.index].id
  route_table_id = aws_route_table.main-public.id
}

resource "aws_route" "internet-access" {
  route_table_id = aws_vpc.main.main_route_table_id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id = aws_internet_gateway.main-gw.id
}
