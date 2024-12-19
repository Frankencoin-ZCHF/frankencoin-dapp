#!/bin/sh
set -e

echo "=========="
echo "dEURO dApp"
echo "=========="

# Replace env variable placeholders with real values
printenv | grep NEXT_PUBLIC_ | while read -r line ; do
  echo "Change env ${line}, please wait ..."

  key=$(echo $line | cut -d "=" -f1)
  value=$(echo $line | cut -d "=" -f2)

  find /app/.next/ -type f -exec sed -i "s|$key|$value|g" {} \;
done

# Execute the container's main process (CMD in Dockerfile)
exec "$@"
