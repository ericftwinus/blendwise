import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db/prisma";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const uid = session.metadata?.firebaseUid;
      const tier = parseInt(session.metadata?.tier || "1", 10);

      if (uid) {
        await prisma.profile.updateMany({
          where: { userId: uid },
          data: {
            subscriptionTier: tier,
          },
        });
        console.log(`Updated user ${uid} to tier ${tier}`);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata?.firebaseUid;

      if (uid) {
        await prisma.profile.updateMany({
          where: { userId: uid },
          data: { subscriptionTier: 1 },
        });
        console.log(`Downgraded user ${uid} to tier 1 (subscription cancelled)`);
      }
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const uid = subscription.metadata?.firebaseUid;

      if (uid && subscription.status === "active") {
        const tier = parseInt(subscription.metadata?.tier || "1", 10);
        await prisma.profile.updateMany({
          where: { userId: uid },
          data: { subscriptionTier: tier },
        });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
