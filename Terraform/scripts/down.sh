#!/bin/bash
# ============================================================
# DOWN - Tear down the AWS infrastructure to save costs
# Usage: ./scripts/down.sh
# ============================================================
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TERRAFORM_DIR="$(dirname "$SCRIPT_DIR")"

cd "$TERRAFORM_DIR"

echo ""
echo "💰  Tearing down AWS infrastructure to save costs..."
echo "-------------------------------------------"
echo ""
echo "⚠️  WARNING: This will destroy ALL resources including the database."
echo "   Make sure you've exported any data you need to keep."
echo ""
read -p "   Type 'yes' to confirm: " confirm

if [ "$confirm" != "yes" ]; then
  echo "❌  Cancelled."
  exit 1
fi

echo ""

# Optional: snapshot RDS before destroy
read -p "📸  Take an RDS snapshot before destroying? (recommended) [y/N]: " snap

if [[ "$snap" =~ ^[Yy]$ ]]; then
  SNAPSHOT_ID="academy-dev-snapshot-$(date +%Y%m%d-%H%M)"
  echo "   Creating RDS snapshot: $SNAPSHOT_ID ..."
  aws rds create-db-snapshot \
    --db-instance-identifier "academy-dev-mysql" \
    --db-snapshot-identifier "$SNAPSHOT_ID" \
    --region ap-south-1 \
    --output text --query 'DBSnapshot.Status' 2>/dev/null \
    && echo "   ✅ Snapshot initiated: $SNAPSHOT_ID (will complete in the background)" \
    || echo "   ⚠️  Snapshot failed or AWS CLI not configured — continuing anyway"
  echo ""
fi

# Destroy everything
terraform destroy -var-file="secrets.tfvars" -auto-approve

echo ""
echo "✅  Infrastructure is DOWN. You're paying \$0/hour now."
echo ""
echo "💡  To bring it back up, run:  ./scripts/up.sh"
echo "💡  Don't forget to re-run DB migrations after you bring it back up!"
