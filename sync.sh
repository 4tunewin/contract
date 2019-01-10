#!/bin/bash

# Remember name of current dir to skip it later
currentDir=`basename $(pwd)`

# Go over each folder in parent directory and copy contract
# if <DIR>/src/contracts/ folder exists.
for item in ../*/; do
    if [ -d "${item}" ]; then
        dir=`basename $item`
        
        if [ "${currentDir}" != "${dir}" ]; then
            if [ -d "../${dir}/src/contracts" ]; then
                echo "➜ Syncing \"${dir}\" directory"
                cp ./build/contracts/*.json ../${dir}/src/contracts
            fi
        fi
    fi
done