#!/usr/bin/env sh

set -eu

confirm_brew_install() {
  if [ -r /dev/tty ]; then
    printf "gitleaks is required for pre-commit hooks. Install via Homebrew now? [y/N] " > /dev/tty
    read -r response < /dev/tty
  else
    echo "gitleaks is not installed."
    echo "No interactive terminal is available for confirmation."
    echo "Install manually from https://github.com/gitleaks/gitleaks#installation"
    return 1
  fi

  response=$(printf '%s' "$response" | tr '[:upper:]' '[:lower:]')
  case "$response" in
    y|ye|yes)
      return 0
      ;;
    *)
      echo "Skipped Homebrew install."
      echo "Install manually from https://github.com/gitleaks/gitleaks#installation"
      return 1
      ;;
  esac
}

# gitleaks already installed
if command -v gitleaks >/dev/null 2>&1; then
  exit 0
fi

# install via brew if brew installed
if command -v brew >/dev/null 2>&1; then
  if confirm_brew_install; then
    echo "Installing gitleaks via Homebrew..."
    brew install gitleaks
    exit 0
  fi
  exit 1
fi

echo "gitleaks is required for pre-commit hooks."
echo "Install it from https://github.com/gitleaks/gitleaks#installation,"
echo "then rerun yarn install / yarn prek:install"
exit 1