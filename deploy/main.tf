terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.16"
    }
  }

  required_version = ">= 1.2.0"
}

provider "aws" {
  region  = "us-west-2"
}

resource "aws_key_pair" "deployer" {
  key_name   = "deployer-key"
  public_key = file("~/.ssh/id_rsa.pub") 
}

resource "aws_security_group" "allow_all" {
  name        = "allow_all"
  description = "Allow all inbound traffic"
  vpc_id = aws_vpc.main.id  # Use the custom VPC

  ingress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "allow_all"
  }
}

resource "aws_instance" "app_server" {
  ami           = "ami-02d8bad0a1da4b6fd"
  instance_type = "t2.small"
  
  key_name        = aws_key_pair.deployer.key_name
  vpc_security_group_ids = [aws_security_group.allow_all.id]
  subnet_id     = aws_subnet.main.id  # Use the custom subnet

  tags = {
    Name = "DogezAppServer"
  }
}

resource "aws_eip" "eip" {
  vpc      = true
}

resource "aws_eip_association" "eip_assoc" {
  instance_id   = aws_instance.app_server.id
  allocation_id = aws_eip.eip.id
}
