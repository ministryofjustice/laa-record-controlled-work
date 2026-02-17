#!/bin/bash

# Script to extract URLs from Playwright debug log
# Usage: ./extract-urls.sh [log-file]

LOG_FILE=${1:-"playwright-debug.log"}

if [ ! -f "$LOG_FILE" ]; then
    echo "Error: Log file '$LOG_FILE' not found!"
    exit 1
fi

echo "Extracting URLs from $LOG_FILE..."
echo "=================================="

# Extract URLs from navigation lines, remove ANSI color codes, extract just the path
grep -o 'navigating to "[^"]*"' "$LOG_FILE" | \
    sed 's/^.*navigating to "//' | \
    sed 's/"$//' | \
    sed 's|http://localhost:3001||' | \
    sed 's|http://localhost:3000||' | \
    sort | \
    uniq

echo ""
echo "Summary:"
echo "--------"

# Count total navigations
total_navigations=$(grep -c 'navigating to "' "$LOG_FILE")
echo "Total navigations: $total_navigations"

# Count unique paths
unique_paths=$(grep -o 'navigating to "[^"]*"' "$LOG_FILE" | \
    sed 's/^.*navigating to "//' | \
    sed 's/"$//' | \
    sed 's|http://localhost:3000||' | \
    sort | \
    uniq | \
    wc -l)
echo "Unique paths: $unique_paths"

echo ""
echo "Route paths only (for comparison with Express routes):"
echo "----------------------------------------------------"

# Extract just the paths for comparison with listRoutes.js output
grep -o 'navigating to "[^"]*"' "$LOG_FILE" | \
    sed 's/^.*navigating to "//' | \
    sed 's/"$//' | \
    sed 's|http://localhost:3001||' | \
    sed 's|http://localhost:3000||' | \
    sort | \
    uniq | \
    sed 's/^/GET /'
