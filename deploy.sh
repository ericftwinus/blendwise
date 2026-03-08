#!/bin/bash
# ============================================================
# BlendWise GCP Deployment Script
# ============================================================
# Prerequisites:
#   - gcloud CLI authenticated (gcloud auth login)
#   - Project: blendwise-nutrition
#   - Region: us-central1
# ============================================================

# --- Config ---
PROJECT_ID="blendwise-nutrition"
REGION="us-central1"
IMAGE="us-central1-docker.pkg.dev/${PROJECT_ID}/blendwise-repo/blendwise:latest"
CLOUD_SQL_INSTANCE="${PROJECT_ID}:${REGION}:blendwise-nutrition"

# --- Step 1: Build & push Docker image via Cloud Build ---
# Uses cloudbuild.yaml to pass NEXT_PUBLIC_* vars as build args
echo "==> Building and pushing Docker image..."
bash gcloud.sh builds submit \
  --config=cloudbuild.yaml \
  --substitutions=_NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAu4BebPOHO4VQHTv4_85tyIHdwITUbkKQ,_NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=blendwise-nutrition.firebaseapp.com,_NEXT_PUBLIC_FIREBASE_PROJECT_ID=blendwise-nutrition,_NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=blendwise-nutrition.firebasestorage.app,_NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=638462604295,_NEXT_PUBLIC_FIREBASE_APP_ID=1:638462604295:web:5191b625b3d4e2662f66a2

# --- Step 2: Deploy to Cloud Run ---
echo "==> Deploying to Cloud Run..."
bash gcloud.sh run deploy blendwise \
  --image="${IMAGE}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --port=8080 \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=3 \
  --add-cloudsql-instances="${CLOUD_SQL_INSTANCE}" \
  --set-env-vars="\
DATABASE_URL=${DATABASE_URL}?host=/cloudsql/${CLOUD_SQL_INSTANCE},\
GCS_BUCKET_NAME=blendwise-referral-documents,\
XAI_API_KEY=${XAI_API_KEY},\
AUTH_WEBHOOK_SECRET=${AUTH_WEBHOOK_SECRET},\
FAX_SANDBOX=true,\
STRIPE_SECRET_KEY=${STRIPE_SECRET_KEY:-placeholder},\
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET:-placeholder},\
STRIPE_PRICE_TIER_2=${STRIPE_PRICE_TIER_2:-placeholder},\
STRIPE_PRICE_TIER_3=${STRIPE_PRICE_TIER_3:-placeholder},\
NEXT_PUBLIC_APP_URL=https://blendwisenutrition.com,\
NODE_ENV=production"

echo "==> Done! Service URL:"
bash gcloud.sh run services describe blendwise --region="${REGION}" --format="value(status.url)"

# ============================================================
# Other useful commands:
#
# Local dev (requires Cloud SQL proxy running):
#   ./cloud-sql-proxy.exe blendwise-nutrition:us-central1:blendwise-nutrition \
#     --port 5433 --credentials-file ./blendwise-nutrition-82c55de70d81.json
#   npm run dev
#
# Deploy Firebase Cloud Function:
#   firebase deploy --only functions --project blendwise-nutrition
#
# Seed test users:
#   node scripts/seed-users.js
#
# Run Prisma migrations:
#   npx prisma migrate deploy
# ============================================================
