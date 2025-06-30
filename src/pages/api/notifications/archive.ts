// Archive action handler API endpoint
import type { APIRoute } from 'astro';

export const prerender = false;

// In-memory storage for demo (use database in production)
const archivedNotifications = new Set();

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    console.log('📂 Archive action received:', data);
    
    // Store the archived notification
    archivedNotifications.add(data.notificationId);
    
    // In a real app, you'd update your database here
    // await db.notifications.update(data.notificationId, { archived: true });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'archived',
        id: data.notificationId,
        timestamp: data.timestamp
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('❌ Archive action error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to archive notification' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ 
      archived: Array.from(archivedNotifications),
      count: archivedNotifications.size
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};