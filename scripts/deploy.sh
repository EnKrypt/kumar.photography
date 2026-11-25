#!/bin/sh

react-router build
rm -rf ../kumar.photography-build/public/
cp -r ./build/client ../kumar.photography-build/public
cd ../kumar.photography-build
git add .
git commit -m "Generated production build"
git push
