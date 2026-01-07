#!/bin/sh
set -e

# Replace environment variables in built JS files at runtime
# This allows changing API URL without rebuilding
if [ ! -z "$REACT_APP_API_URL" ]; then
    echo "Setting API URL to: $REACT_APP_API_URL"
    find /usr/share/nginx/html/static/js -type f -name "*.js" -exec \
        sed -i "s|http://localhost:8080/api|$REACT_APP_API_URL|g" {} +
fi

# Execute the CMD
exec "$@"
