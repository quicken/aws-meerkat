#!/bin/bash
export NODE_ENV=production
# rm -rf ./build 
npx tsc -p tsconfig.json 
cp ./package.json ./build/
cd ./build
yarn install
zip -r code-pipeline-monitor.zip ./
echo Build Completed
