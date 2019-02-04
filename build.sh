#!/bin/bash
docker build --no-cache --network=host -f Dockerfile -t gridappsd/viz:1.0 .
