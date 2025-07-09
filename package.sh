#!/bin/bash
cd ./build
zip code-pipeline-monitor.zip index.js
echo "Package size: $(du -h code-pipeline-monitor.zip | cut -f1)"
