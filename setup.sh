#!/usr/bin/env bash
# ResQ AI — Deployment setup script
# Used by Hugging Face Spaces and other cloud platforms
# that require a custom setup step.

set -e

echo "=== ResQ AI setup ==="

# Ensure pip is up to date
python3 -m pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt

echo "=== Setup complete ==="
