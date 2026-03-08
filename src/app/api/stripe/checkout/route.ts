import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerUser } from "@/lib/firebase/server-auth";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export async function POST(req: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await req.json();
    const priceMap: Record<string, string> = {
      "2": process.env.STRIPE_PRICE_TIER_2 || "",
      "3": process.env.STRIPE_PRICE_TIER_3 || "",
    };
    const priceId = priceMap[String(tier)];

    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid tier selected" },
        { status: 400 }
      );
    }

    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user.email || undefined,
      metadata: {
        firebaseUid: user.uid,
        tier: String(tier),
      },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://blendwisenutrition.com"}/dashboard/settings?upgraded=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://blendwisenutrition.com"}/dashboard/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
