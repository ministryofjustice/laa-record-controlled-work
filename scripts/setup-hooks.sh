#!/bin/bash

# Skip in CI or Docker environments
if [ -n "$CI" ] || [ -f /.dockerenv ]; then
  echo "Skipping Git hooks setup in CI/Docker environment"
  exit 0
fi

# Setup script for Git hooks
echo "Setting up Pre-commit..."

# Install prek globally
echo "Installing prek globally"
curl --proto '=https' --tlsv1.2 \
-LsSf https://raw.githubusercontent.com/ministryofjustice/devsecops-hooks/a3f792a077eb216c2e9ac9a4c2eac34cea618ee2/prek/prek-installer.sh | sh

# Activate prek in the repository
echo "Installing prek within the repository"
export PATH="$HOME/.local/bin:$PATH"
prek install

echo "Git hooks setup complete!"
echo "The pre-commit hook will now run Ministry of Justice - Secrets Scanner - GitLeaks"
