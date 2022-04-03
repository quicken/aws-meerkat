#!/bin/bash

# Helper script for starting the development environment.

# Bash "strict mode", to help catch problems and bugs in the shell
# script. Every bash script you write should include this. See
# http://redsymbol.net/articles/unofficial-bash-strict-mode/ for
# details.
set -euo pipefail

if [ -z ${MEERKAT_HOME+x} ];
  then
    echo "Specify the path to the Project folder with the environment variable MEERKAT_HOME"
    exit
fi

echo "Using the source code located at:"
echo
echo ${MEERKAT_HOME}
echo
echo
echo "Select the environment to start:"
echo " 1) Development Stack"
echo " 2) placeholder"
echo " 3) Exit"

read n
case $n in
        1) option=1;;
        2) option=2;;
        3) exit;;
        *)
                echo "Invalid Option"
                exit
                ;;
esac

echo
# echo Signing into AWS
# aws ecr get-login-password --region ap-southeast-2 | docker login --username AWS --password-stdin AWS_ECR_ARN

echo
case $option in
        1)
            echo "Starting the development stack"
            docker-compose  -f ${MEERKAT_HOME}/_dev/docker/compose-dev.yml up --remove-orphans
            ;;
        2)
            echo "Placholder for future use."
            ;;
esac
