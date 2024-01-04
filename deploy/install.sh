#!/bin/bash

INSTANCE_IP="${INSTANCE_IP:?Set INSTANCE_IP environment variable}"

# host setup
sudo yum install docker
sudo systemctl enable docker.service
sudo systemctl start docker.service
sudo usermod -a -G docker ec2-user
id ec2-user
newgrp docker

sudo yum install git -y
git clone git@github.com:sjtindell/dogez.git

# db
rsync -avz -e "ssh -i ~/.ssh/id_rsa" points.db ec2-user@$INSTANCE_IP:/home/ec2-user/dogez/points.db

# blockchain

docker pull ghcr.io/foundry-rs/foundry:latest
docker tag ghcr.io/foundry-rs/foundry:latest foundry:latest
docker run -p 8545:8545 -d foundry "anvil --port 8545 --host 0.0.0.0"
# ./deploy.sh

# ipfs
docker pull ipfs/go-ipfs
docker run -d --name ipfs_node -v $HOME/.ipfs:/data/ipfs -p 8080:8080 -p 4001:4001 -p 5001:5001 ipfs/go-ipfs:latest daemon --offline
docker exec $(docker ps -a | grep ipfs | awk '{print $1}') ipfs add /data/ipfs/doge.png
docker exec $(docker ps -a | grep ipfs | awk '{print $1}') ipfs add /data/ipfs/joint.png
docker exec $(docker ps -a | grep ipfs | awk '{print $1}') ipfs add /data/ipfs/sunglasses.png
docker exec $(docker ps -a | grep ipfs | awk '{print $1}') ipfs add /data/ipfs/mlg_hat.png

# nginx
# update namecheap dns
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install certbot certbot-nginx
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
sudo certbot certonly --standalone

docker run --name nginx-proxy -p 443:443 -p 80:80 \
-v /home/ec2-user/dogez/deploy/nginx.conf:/etc/nginx/conf.d/default.conf \
-v /etc/letsencrypt/live/dogez.app/fullchain.pem:/etc/nginx/certs/fullchain.pem \
-v /etc/letsencrypt/live/dogez.app/privkey.pem:/etc/nginx/certs/privkey.pem \
-d nginx

# deploy contracts
# cd contracts; ./deploy.sh

# app
docker build -t dogez-web .

docker run -p 3000:3000 \
-v /home/ec2-user/dogez/points.db:/app/points.db \
-v /home/ec2-user/dogez/dogez-app/public/json/:/app/public/json/ \
-e NODE_ENV=production -d dogez-web

# CONTAINER=$(docker ps | grep 3000 | awk '{print $1}'); docker stop $CONTAINER; docker rm $CONTAINER
