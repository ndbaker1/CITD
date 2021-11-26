#!/bin/bash
docker build . -t connect4 && \
docker rm -f $(docker ps -qa); \
docker run -d -e PORT=8000 -p 80:8000 connect4