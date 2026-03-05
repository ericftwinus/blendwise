#!/usr/bin/env bash
# ─── BlendWise GCS Bucket HIPAA Audit Script ───
# Run: bash scripts/audit-gcs-bucket.sh <BUCKET_NAME>
# Requires: gcloud CLI authenticated with sufficient permissions

set -euo pipefail

BUCKET="${1:-blendwise-referral-documents}"
PROJECT="${2:-$(gcloud config get-value project 2>/dev/null)}"

echo "=== GCS Bucket HIPAA Audit: gs://$BUCKET ==="
echo ""

# 1. Check Uniform Bucket-Level Access
echo "1. Uniform Bucket-Level Access"
UAL=$(gcloud storage buckets describe "gs://$BUCKET" --format="value(iamConfiguration.uniformBucketLevelAccess.enabled)" 2>/dev/null || echo "UNKNOWN")
if [ "$UAL" = "True" ]; then
  echo "   [PASS] Uniform bucket-level access is ENABLED"
else
  echo "   [FAIL] Uniform bucket-level access is DISABLED — enforcing now..."
  gcloud storage buckets update "gs://$BUCKET" --uniform-bucket-level-access
  echo "   [FIXED] Uniform bucket-level access enabled"
fi
echo ""

# 2. Check Public Access Prevention
echo "2. Public Access Prevention"
PAP=$(gcloud storage buckets describe "gs://$BUCKET" --format="value(iamConfiguration.publicAccessPrevention)" 2>/dev/null || echo "UNKNOWN")
if [ "$PAP" = "enforced" ]; then
  echo "   [PASS] Public access prevention is ENFORCED"
else
  echo "   [FAIL] Public access prevention is NOT enforced — enforcing now..."
  gcloud storage buckets update "gs://$BUCKET" --public-access-prevention
  echo "   [FIXED] Public access prevention enforced"
fi
echo ""

# 3. Check Data Access Audit Logs
echo "3. Data Access Audit Logs"
echo "   Checking IAM audit config for storage.googleapis.com..."
AUDIT_CONFIG=$(gcloud projects get-iam-policy "$PROJECT" --format=json 2>/dev/null | \
  python3 -c "
import sys, json
policy = json.load(sys.stdin)
configs = policy.get('auditConfigs', [])
for c in configs:
    if c.get('service') == 'storage.googleapis.com':
        types = [l['logType'] for l in c.get('auditLogConfigs', [])]
        print(','.join(types))
        sys.exit(0)
print('NONE')
" 2>/dev/null || echo "CHECK_FAILED")

if echo "$AUDIT_CONFIG" | grep -q "DATA_READ"; then
  echo "   [PASS] DATA_READ audit logging is enabled"
else
  echo "   [WARN] DATA_READ audit logging may not be enabled"
  echo "   Run: gcloud projects get-iam-policy $PROJECT > /tmp/policy.yaml"
  echo "   Add storage.googleapis.com audit config, then set-iam-policy"
fi

if echo "$AUDIT_CONFIG" | grep -q "DATA_WRITE"; then
  echo "   [PASS] DATA_WRITE audit logging is enabled"
else
  echo "   [WARN] DATA_WRITE audit logging may not be enabled"
fi
echo ""

# 4. Check bucket location and storage class
echo "4. Bucket Location & Storage Class"
LOCATION=$(gcloud storage buckets describe "gs://$BUCKET" --format="value(location)" 2>/dev/null || echo "UNKNOWN")
CLASS=$(gcloud storage buckets describe "gs://$BUCKET" --format="value(storageClass)" 2>/dev/null || echo "UNKNOWN")
echo "   Location: $LOCATION"
echo "   Storage Class: $CLASS"
echo ""

# 5. Check versioning (recommended for HIPAA audit trail)
echo "5. Object Versioning"
VERSIONING=$(gcloud storage buckets describe "gs://$BUCKET" --format="value(versioning.enabled)" 2>/dev/null || echo "UNKNOWN")
if [ "$VERSIONING" = "True" ]; then
  echo "   [PASS] Object versioning is ENABLED"
else
  echo "   [WARN] Object versioning is DISABLED — recommended for HIPAA audit trail"
  echo "   To enable: gcloud storage buckets update gs://$BUCKET --versioning"
fi
echo ""

echo "=== Audit Complete ==="
