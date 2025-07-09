#!/bin/bash

set -euo pipefail

export NODE_ENV=production
rm -rf ./build/*
node esbuild.config.js
echo Build Completed
