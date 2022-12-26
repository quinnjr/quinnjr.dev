resource "aws_eip" "lb" {
  vpc = true

  depends_on = [
    aws_internet_gateway.main-gw
  ]
}
