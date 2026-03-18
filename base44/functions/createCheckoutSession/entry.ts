import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';
import Stripe from 'npm:stripe@14.21.0';

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY"));

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listing_id, success_url, cancel_url } = await req.json();

    if (!listing_id) {
      return Response.json({ error: 'listing_id is required' }, { status: 400 });
    }

    // Fetch the listing
    const listings = await base44.asServiceRole.entities.MarketplaceListing.filter({ id: listing_id });
    const listing = listings[0];

    if (!listing) {
      return Response.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (!listing.price || listing.price === 0) {
      return Response.json({ error: 'This listing is free' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: listing.name,
              description: listing.description || undefined,
              images: listing.cover_image ? [listing.cover_image] : [],
            },
            unit_amount: Math.round(listing.price * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: success_url || `${req.headers.get('origin')}/Marketplace?purchased=true`,
      cancel_url: cancel_url || `${req.headers.get('origin')}/Marketplace`,
      customer_email: user.email,
      metadata: {
        base44_app_id: Deno.env.get("BASE44_APP_ID"),
        listing_id,
        user_email: user.email,
      },
    });

    return Response.json({ url: session.url });
  } catch (error) {
    console.error('Checkout session error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});