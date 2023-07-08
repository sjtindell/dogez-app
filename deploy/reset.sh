#! /bin/bash

git pull
docker build -t dogez-web .
CONTAINER=$(docker ps | grep 3000 | awk '{print $1}'); docker stop $CONTAINER; docker rm $CONTAINER
docker run -p 3000:3000 \
-v /home/ec2-user/dogez/points.db:/app/points.db \
-v /home/ec2-user/dogez/dogez-app/public/json/:/app/public/json/ \
-e NODE_ENV=production -d dogez-web
