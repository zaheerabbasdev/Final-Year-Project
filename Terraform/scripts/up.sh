#!/bin/bash
# ============================================================
# UP - Bring the full AWS infrastructure online
# Usage: ./scripts/up.sh
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"

echo ""
echo "🚀  Bringing up AWS infrastructure..."
echo "-------------------------------------------"

cd "$TERRAFORM_DIR"

# Init in case providers need refreshing
terraform init -input=false > /dev/null

# Apply
terraform apply -var-file="secrets.tfvars" -auto-approve

echo ""
echo "✅  Infrastructure is UP!"
echo ""
echo "🌐  ALB URL:"
terraform output alb_dns_name
echo ""
echo "💡  When you're done testing, run:  ./scripts/down.sh"
