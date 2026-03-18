import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    let event;
    if (webhookSecret && signature) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      event = JSON.parse(body);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const { listing_id, user_email } = session.metadata || {};

      if (listing_id && user_email) {
        // Check if purchase already exists
        const existing = await base44.asServiceRole.entities.Purchase.filter({
          listing_id,
          user_email,
        });

        if (existing.length === 0) {
          await base44.asServiceRole.entities.Purchase.create({
            listing_id,
            user_email,
          });
          console.log(`Purchase recorded: ${user_email} -> ${listing_id}`);
        }
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});