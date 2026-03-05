const { onRequest } = require("firebase-functions/v2/https");
const { beforeUserCreated } = require("firebase-functions/v2/identity");
const logger = require("firebase-functions/logger");

const APP_URL = process.env.APP_URL || "https://blendwise-usheveygaa-uc.a.run.app";
const AUTH_WEBHOOK_SECRET = process.env.AUTH_WEBHOOK_SECRET;

/**
 * Firebase Auth blocking function — fires when a new user is created.
 * Sends a webhook to our Next.js API to create User + Profile records in Cloud SQL.
 */
exports.onUserCreated = beforeUserCreated(async (event) => {
  const { uid, email, displayName } = event.data;

  // Determine role from custom claims (set during signup)
  const role = event.data.customClaims?.role || "patient";

  try {
    const res = await fetch(`${APP_URL}/api/webhooks/user-created`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AUTH_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify({ uid, email, displayName, role }),
    });

    if (!res.ok) {
      const error = await res.text();
      logger.error("User-created webhook failed:", { uid, email, status: res.status, error });
    } else {
      logger.info("User-created webhook succeeded:", { uid, email, role });
    }
  } catch (err) {
    logger.error("User-created webhook error:", { uid, email, error: err.message });
    // Don't throw — allow user creation to proceed even if webhook fails.
    // Signup pages also call the webhook as a fallback.
  }
});
