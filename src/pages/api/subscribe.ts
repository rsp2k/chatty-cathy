// src/pages/api/subscribe.ts
import type { APIRoute } from 'astro';

// Enable server-side rendering for this endpoint
export const prerender = false;

// In a real app, you'd use a database. For now, we'll use in-memory storage
// Consider using Redis, PostgreSQL, or your preferred database
const subscriptions = new Set<string>();

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { subscription, userAgent, timestamp } = body;

    if (!subscription || !subscription.endpoint) {
      return new Response(
        JSON.stringify({ error: 'Invalid subscription data' }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Store the subscription (in production, save to database)
    const subscriptionKey = subscription.endpoint;
    subscriptions.add(JSON.stringify({
      subscription,
      userAgent,
      timestamp,
      subscribed: new Date().toISOString()
    }));

    console.log(`📱 New push subscription registered: ${subscriptions.size} total`);
    console.log(`   User Agent: ${userAgent}`);
    console.log(`   Endpoint: ${subscription.endpoint.substring(0, 50)}...`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Subscription saved successfully',
        totalSubscriptions: subscriptions.size
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error handling subscription:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = async () => {
  // Return subscription stats
  return new Response(
    JSON.stringify({ 
      totalSubscriptions: subscriptions.size,
      subscriptions: Array.from(subscriptions).map(sub => {
        const parsed = JSON.parse(sub);
        return {
          endpoint: parsed.subscription.endpoint.substring(0, 50) + '...',
          userAgent: parsed.userAgent,
          subscribed: parsed.subscribed
        };
      })
    }), 
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};

// Export subscriptions for use in other API routes
export { subscriptions };
