#!/bin/bash

set -euo pipefail

export NODE_ENV=production
rm -rf ./build/*
npx tsc -p tsconfig.json
cp ./package.json ./build/
cd ./build
yarn install
echo Build Completed
