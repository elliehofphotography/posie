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

    const type = event.type;
    const obj = event.data.object;

    // ── One-time guide purchase ──────────────────────────────────────────────
    if (type === 'checkout.session.completed' && obj.mode === 'payment') {
      const { listing_id, user_email } = obj.metadata || {};
      if (listing_id && user_email) {
        const existing = await base44.asServiceRole.entities.Purchase.filter({ listing_id, user_email });
        if (existing.length === 0) {
          await base44.asServiceRole.entities.Purchase.create({ listing_id, user_email });
          console.log(`Purchase recorded: ${user_email} -> ${listing_id}`);
        }
      }
    }

    // ── Subscription started / renewed ──────────────────────────────────────
    if (type === 'checkout.session.completed' && obj.mode === 'subscription') {
      const user_email = obj.metadata?.user_email || obj.customer_email;
      const subscription_id = obj.subscription;
      if (user_email) {
        const users = await base44.asServiceRole.entities.User.filter({ email: user_email });
        if (users.length > 0) {
          await base44.asServiceRole.entities.User.update(users[0].id, {
            subscription_status: 'active',
            stripe_subscription_id: subscription_id,
            stripe_customer_id: obj.customer,
          });
          console.log(`Subscription activated: ${user_email}`);
        }
      }
    }

    // ── Subscription updated (e.g. reactivated) ──────────────────────────────
    if (type === 'customer.subscription.updated') {
      const customerId = obj.customer;
      const status = obj.status; // 'active', 'canceled', 'past_due', etc.
      const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
      if (users.length > 0) {
        const mapped = status === 'active' ? 'active' : status === 'canceled' ? 'canceled' : 'free';
        await base44.asServiceRole.entities.User.update(users[0].id, {
          subscription_status: mapped,
          stripe_subscription_id: obj.id,
        });
        console.log(`Subscription updated: ${users[0].email} -> ${mapped}`);
      }
    }

    // ── Subscription canceled ────────────────────────────────────────────────
    if (type === 'customer.subscription.deleted') {
      const customerId = obj.customer;
      const users = await base44.asServiceRole.entities.User.filter({ stripe_customer_id: customerId });
      if (users.length > 0) {
        await base44.asServiceRole.entities.User.update(users[0].id, {
          subscription_status: 'free',
        });
        console.log(`Subscription canceled: ${users[0].email}`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return Response.json({ error: error.message }, { status: 400 });
  }
});