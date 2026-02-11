import Stripe from "stripe";

function securityHeaders() {
  return {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "browsing-topics=(), run-ad-auction=(), join-ad-interest-group=(), private-state-token-redemption=(), private-state-token-issuance=(), private-aggregation=(), attribution-reporting=()",
  };
}

export async function onRequestPost({ request, env }) {
  try {
    if (!env.STRIPE_S_KEY) {
      return new Response("Missing STRIPE_S_KEY", { status: 500, headers: securityHeaders() });
    }
    if (!env.STRIPE_PRICE_ID) {
      return new Response("Missing STRIPE_PRICE_ID", { status: 500, headers: securityHeaders() });
    }
    if (!env.SUCCESS_URL || !env.CANCEL_URL) {
      return new Response("Missing SUCCESS_URL / CANCEL_URL", { status: 500, headers: securityHeaders() });
    }

    const stripe = new Stripe(env.STRIPE_S_KEY);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],

      phone_number_collection: { enabled: true },
      shipping_address_collection: { allowed_countries: ["US"] },
      billing_address_collection: "required",
      allow_promotion_codes: true,

      success_url: env.SUCCESS_URL,
      cancel_url: env.CANCEL_URL,
    });

    // 303 redirect to Stripe Checkout (matches your Node server)
    return new Response(null, {
      status: 303,
      headers: { Location: session.url, ...securityHeaders() },
    });
  } catch (err) {
    console.error("Stripe error:", err);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
      headers: { "content-type": "application/json", ...securityHeaders() },
    });
  }
}
