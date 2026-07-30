#!/bin/bash
NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")
cd ./build
zip "${NAME}-${VERSION}.zip" index.js
echo "Package: ${NAME}-${VERSION}.zip ($(du -h "${NAME}-${VERSION}.zip" | cut -f1))"
