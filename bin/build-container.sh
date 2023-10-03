#!/bin/sh

cd "$( dirname -- "$0"; )"

cd ..

aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 922147267922.dkr.ecr.us-east-2.amazonaws.com

docker build -f docker/production.Dockerfile -t 922147267922.dkr.ecr.us-east-2.amazonaws.com/website:latest .

docker push 922147267922.dkr.ecr.us-east-2.amazonaws.com/website:latest
