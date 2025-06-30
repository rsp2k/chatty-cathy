// Like action handler API endpoint
import type { APIRoute } from 'astro';

export const prerender = false;

// In-memory storage for demo (use database in production)
const likedNotifications = new Map(); // id -> { count, users }

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    
    console.log('❤️ Like action received:', data);
    
    const notificationId = data.notificationId;
    
    // Update like count
    if (!likedNotifications.has(notificationId)) {
      likedNotifications.set(notificationId, { count: 0, users: [] });
    }
    
    const likeData = likedNotifications.get(notificationId);
    likeData.count += 1;
    likeData.users.push({
      timestamp: data.timestamp,
      userAgent: data.userAgent || 'Unknown'
    });
    
    // In a real app, you'd update your database here
    // await db.notifications.incrementLikes(notificationId);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        action: 'liked',
        id: notificationId,
        totalLikes: likeData.count,
        timestamp: data.timestamp
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('❌ Like action error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to like notification' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = async () => {
  const stats = Array.from(likedNotifications.entries()).map(([id, data]) => ({
    id,
    likes: data.count,
    lastLiked: Math.max(...data.users.map(u => u.timestamp))
  }));
  
  return new Response(
    JSON.stringify({ 
      likedNotifications: stats,
      totalLikes: stats.reduce((sum, item) => sum + item.likes, 0)
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};