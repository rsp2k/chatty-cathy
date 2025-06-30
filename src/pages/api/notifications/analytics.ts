// Analytics tracking API endpoint for notifications
import type { APIRoute } from 'astro';

export const prerender = false;

// In-memory analytics storage (use database in production)
const analyticsData = {
  events: [],
  summary: {
    totalClicks: 0,
    totalViews: 0,
    totalCloses: 0,
    actionClicks: {},
    dailyStats: {}
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const eventData = await request.json();
    
    console.log('📊 Analytics event:', eventData);
    
    // Add timestamp if not present
    if (!eventData.timestamp) {
      eventData.timestamp = Date.now();
    }
    
    // Store the event
    analyticsData.events.push(eventData);
    
    // Update summary stats
    switch (eventData.event) {
      case 'click':
        analyticsData.summary.totalClicks++;
        break;
      case 'view':
        analyticsData.summary.totalViews++;
        break;
      case 'close':
        analyticsData.summary.totalCloses++;
        break;
    }
    
    // Track action clicks
    if (eventData.action) {
      if (!analyticsData.summary.actionClicks[eventData.action]) {
        analyticsData.summary.actionClicks[eventData.action] = 0;
      }
      analyticsData.summary.actionClicks[eventData.action]++;
    }
    
    // Track daily stats
    const today = new Date().toISOString().split('T')[0];
    if (!analyticsData.summary.dailyStats[today]) {
      analyticsData.summary.dailyStats[today] = { events: 0, actions: {} };
    }
    analyticsData.summary.dailyStats[today].events++;
    
    // Keep only last 1000 events to prevent memory overflow
    if (analyticsData.events.length > 1000) {
      analyticsData.events = analyticsData.events.slice(-1000);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        eventRecorded: eventData.event,
        totalEvents: analyticsData.events.length
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('❌ Analytics error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to record analytics event' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = async () => {
  // Calculate engagement metrics
  const totalNotifications = analyticsData.summary.totalViews;
  const totalInteractions = analyticsData.summary.totalClicks;
  const engagementRate = totalNotifications > 0 
    ? Math.round((totalInteractions / totalNotifications) * 100) 
    : 0;
  
  // Get recent events (last 50)
  const recentEvents = analyticsData.events.slice(-50);
  
  // Most popular actions
  const popularActions = Object.entries(analyticsData.summary.actionClicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  
  return new Response(
    JSON.stringify({
      summary: {
        ...analyticsData.summary,
        engagementRate: `${engagementRate}%`,
        totalEvents: analyticsData.events.length
      },
      recentEvents,
      popularActions: popularActions.map(([action, count]) => ({ action, count })),
      insights: {
        mostEngaging: popularActions[0]?.[0] || 'N/A',
        totalInteractions,
        averageActionsPerDay: Math.round(totalInteractions / Math.max(Object.keys(analyticsData.summary.dailyStats).length, 1))
      }
    }),
    { 
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};