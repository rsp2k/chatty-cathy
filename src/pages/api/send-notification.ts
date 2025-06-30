// Enhanced send-notification API with rich action templates
import type { APIRoute } from 'astro';
import webpush from 'web-push';
import { subscriptions } from './subscribe';

export const prerender = false;

// Configure web-push with your VAPID keys
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:your-email@example.com',
  process.env.VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
);

// Predefined action templates for different notification types
const ACTION_TEMPLATES = {
  default: [
    { action: 'open', title: '👀 View', icon: '/pwa-192x192.png' },
    { action: 'close', title: '❌ Dismiss' }
  ],
  
  message: [
    { action: 'reply', title: '💬 Reply', icon: '/pwa-192x192.png' },
    { action: 'archive', title: '📂 Archive' },
    { action: 'close', title: '❌ Dismiss' }
  ],
  
  social: [
    { action: 'like', title: '❤️ Like', icon: '/pwa-192x192.png' },
    { action: 'comment', title: '💬 Comment' },
    { action: 'share', title: '🔗 Share' },
    { action: 'close', title: '❌ Dismiss' }
  ],
  
  news: [
    { action: 'read', title: '📖 Read More', icon: '/pwa-192x192.png' },
    { action: 'save', title: '⭐ Save for Later' },
    { action: 'share', title: '🔗 Share' },
    { action: 'close', title: '❌ Dismiss' }
  ],
  
  reminder: [
    { action: 'complete', title: '✅ Mark Done', icon: '/pwa-192x192.png' },
    { action: 'snooze', title: '⏰ Remind Later' },
    { action: 'close', title: '❌ Dismiss' }
  ],
  
  ecommerce: [
    { action: 'view', title: '🛍️ View Product', icon: '/pwa-192x192.png' },
    { action: 'cart', title: '🛒 Add to Cart' },
    { action: 'wishlist', title: '❤️ Save to Wishlist' },
    { action: 'close', title: '❌ Dismiss' }
  ],
  
  alert: [
    { action: 'acknowledge', title: '✅ Acknowledge', icon: '/pwa-192x192.png' },
    { action: 'details', title: '🔍 View Details' },
    { action: 'close', title: '❌ Dismiss' }
  ]
};

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  template?: keyof typeof ACTION_TEMPLATES;
  vibrate?: number[];
  silent?: boolean;
}export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse JSON payload
    let payload: NotificationPayload;
    
    try {
      const text = await request.text();
      payload = JSON.parse(text);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!payload.title || !payload.body) {
      return new Response(
        JSON.stringify({ error: 'Title and body are required' }), 
        { 
          status: 400, 
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (subscriptions.size === 0) {
      return new Response(
        JSON.stringify({ 
          error: 'No subscribers found',
          hint: 'Make sure users have enabled notifications first'
        }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Generate unique notification ID
    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Determine actions based on template or custom actions
    let actions = payload.actions;
    if (!actions && payload.template && ACTION_TEMPLATES[payload.template]) {
      actions = ACTION_TEMPLATES[payload.template];
    } else if (!actions) {
      actions = ACTION_TEMPLATES.default;
    }

    // Enhanced notification payload with rich features
    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/favicon.ico',
      image: payload.image,
      data: {
        ...payload.data,
        id: notificationId,
        url: payload.data?.url || '/',
        template: payload.template || 'default',
        timestamp: Date.now()
      },
      actions: actions.slice(0, 3), // Limit to 3 actions per Web API spec
      tag: payload.tag || notificationId,
      requireInteraction: payload.requireInteraction || false,
      timestamp: Date.now(),
      vibrate: payload.vibrate || [200, 100, 200], // Custom vibration pattern
      silent: payload.silent || false,
      renotify: true
    };

    console.log(`📤 Sending rich notification to ${subscriptions.size} subscribers:`);
    console.log(`   Title: ${payload.title}`);
    console.log(`   Body: ${payload.body}`);
    console.log(`   Template: ${payload.template || 'default'}`);
    console.log(`   Actions: ${actions.map(a => a.title).join(', ')}`);

    const results = [];
    const failedSubs = [];

    // Send to all subscribers
    for (const subData of subscriptions) {
      try {
        const { subscription } = JSON.parse(subData);
        
        await webpush.sendNotification(
          subscription, 
          JSON.stringify(notificationPayload)
        );
        
        results.push({ 
          success: true, 
          endpoint: subscription.endpoint.substring(0, 50) + '...',
          notificationId 
        });
      } catch (error: any) {
        console.error('Failed to send notification:', error.message);
        
        // If subscription is invalid, remove it
        if (error.statusCode === 410 || error.statusCode === 404) {
          subscriptions.delete(subData);
          failedSubs.push('Removed invalid subscription');
        } else {
          failedSubs.push(`Error: ${error.message}`);
        }
      }
    }

    console.log(`✅ Rich notification sent to ${results.filter(r => r.success).length} subscribers`);
    if (failedSubs.length > 0) {
      console.log(`❌ Failed subscriptions: ${failedSubs.length}`);
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        notificationId,
        template: payload.template || 'default',
        sent: results.filter(r => r.success).length,
        failed: failedSubs.length,
        failedReasons: failedSubs,
        payload: notificationPayload,
        actions: actions.map(a => ({ action: a.action, title: a.title }))
      }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error sending notification:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
// GET endpoint to send test rich notifications
export const GET: APIRoute = async ({ url }) => {
  const template = url.searchParams.get('template') || 'social';
  
  const testPayloads = {
    default: {
      title: '🚀 Welcome to Cool PWA!',
      body: 'Your app is ready with rich notifications',
      template: 'default'
    },
    
    message: {
      title: '💬 New Message',
      body: 'John Doe sent you a message: "Hey, check this out!"',
      template: 'message',
      data: { senderId: 'john_doe', conversationId: 'conv_123' }
    },
    
    social: {
      title: '❤️ Someone liked your post!',
      body: 'Your photo "Sunset at the beach" got 15 new likes',
      template: 'social',
      image: '/pwa-512x512.png',
      data: { postId: 'post_456', totalLikes: 15 }
    },
    
    news: {
      title: '📰 Breaking News',
      body: 'New PWA features announced at developer conference',
      template: 'news',
      image: '/pwa-512x512.png',
      data: { articleId: 'news_789', category: 'tech' }
    },
    
    reminder: {
      title: '⏰ Meeting Reminder',
      body: 'Team standup starts in 15 minutes',
      template: 'reminder',
      requireInteraction: true,
      data: { meetingId: 'meeting_123', time: '2:00 PM' }
    },
    
    ecommerce: {
      title: '🛍️ Flash Sale!',
      body: '50% off on selected items. Limited time offer!',
      template: 'ecommerce',
      image: '/pwa-512x512.png',
      data: { saleId: 'flash_001', discount: 50 }
    },
    
    alert: {
      title: '🚨 System Alert',
      body: 'High CPU usage detected on server',
      template: 'alert',
      requireInteraction: true,
      vibrate: [500, 200, 500, 200, 500],
      data: { alertId: 'alert_001', severity: 'high' }
    }
  };

  const testPayload = testPayloads[template as keyof typeof testPayloads] || testPayloads.social;

  // Add template info to response
  testPayload.data = {
    ...testPayload.data,
    isTest: true,
    template: template
  };

  // Reuse the POST logic
  const request = new Request('http://localhost', {
    method: 'POST',
    body: JSON.stringify(testPayload),
    headers: { 'Content-Type': 'application/json' }
  });

  const response = await POST({ request } as any);
  const result = await response.json();
  
  // Add template info to the response
  if (result.success) {
    result.testTemplate = template;
    result.availableTemplates = Object.keys(testPayloads);
    result.message = `Test notification sent using '${template}' template`;
  }
  
  return new Response(JSON.stringify(result), {
    status: response.status,
    headers: { 'Content-Type': 'application/json' }
  });
};