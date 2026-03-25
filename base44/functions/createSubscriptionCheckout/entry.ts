import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

const PRICES = {
  monthly: 'price_1TExmp9qoUfOe9KUSMIsE40E',
  yearly: 'price_1TExmp9qoUfOe9KUZFKSfnHy',
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan, success_url, cancel_url } = await req.json();

    if (!plan || !PRICES[plan]) {
      return Response.json({ error: 'Invalid plan. Use "monthly" or "yearly"' }, { status: 400 });
    }

    const origin = req.headers.get('origin') || '';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: PRICES[plan], quantity: 1 }],
      customer_email: user.email,
      success_url: success_url || `${origin}/Settings?subscribed=true`,
      cancel_url: cancel_url || `${origin}/Settings`,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        user_email: user.email,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Subscription checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});