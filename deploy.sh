#!/usr/bin/env bash

file=url2image.zip

if [ -f $file ]; then
  echo "Refreshing the archive..."
  zip -f $file
else
  echo "Creating the archive..."
  zip -r $file index.js phantom-script.js phantomjs_linux-x86_64 node_modules/
fi

echo "Archive is ready"
echo "Publishing archive to aws..."
aws lambda update-function-code --function-name url2image-development --zip-file fileb://$file --publish
echo "Finished."
