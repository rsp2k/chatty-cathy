// Enhanced NotificationManager with Rich Actions & Templates
import React, { useState, useEffect } from 'react';

interface SubscriptionStats {
  totalSubscriptions: number;
  subscriptions: Array<{
    endpoint: string;
    userAgent: string;
    subscribed: string;
  }>;
}

interface Analytics {
  summary: {
    totalClicks: number;
    totalViews: number;
    engagementRate: string;
    actionClicks: Record<string, number>;
  };
  popularActions: Array<{ action: string; count: number }>;
  insights: {
    mostEngaging: string;
    totalInteractions: number;
  };
}

const TEMPLATES = {
  default: { name: 'Default', emoji: '🔔', desc: 'Simple notification with basic actions' },
  message: { name: 'Message', emoji: '💬', desc: 'Chat message with reply, archive actions' },
  social: { name: 'Social', emoji: '❤️', desc: 'Social media with like, comment, share' },
  news: { name: 'News', emoji: '📰', desc: 'News article with read, save, share' },
  reminder: { name: 'Reminder', emoji: '⏰', desc: 'Task reminder with complete, snooze' },
  ecommerce: { name: 'E-commerce', emoji: '🛍️', desc: 'Product notification with cart, wishlist' },
  alert: { name: 'Alert', emoji: '🚨', desc: 'System alert with acknowledge, details' }
};

export const NotificationManager: React.FC = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [stats, setStats] = useState<SubscriptionStats | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'templates' | 'custom' | 'analytics'>('dashboard');
  
  // Template testing state
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof TEMPLATES>('social');
  
  // Custom notification state
  const [customNotification, setCustomNotification] = useState({
    title: '🎉 Hello from your PWA!',
    body: 'This is a custom notification with rich actions.',
    template: 'default' as keyof typeof TEMPLATES,
    requireInteraction: false,
    image: '',
    vibrate: true
  });

  useEffect(() => {
    checkSupport();
    checkPermission();
    checkSubscription();
    loadStats();
    loadAnalytics();
  }, []);

  const checkSupport = () => {
    const supported = 'serviceWorker' in navigator && 
                     'PushManager' in window && 
                     'Notification' in window;
    setIsSupported(supported);
  };

  const checkPermission = () => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  };

  const checkSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      setIsSubscribed(!!subscription);
    } catch (error) {
      console.error('Error checking subscription:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/subscribe');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch('/api/notifications/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    }
  };

  const enableNotifications = async () => {
    if (window.enableNotifications) {
      setLoading(true);
      try {
        await window.enableNotifications();
        await checkPermission();
        await checkSubscription();
        await loadStats();
      } finally {
        setLoading(false);
      }
    }
  };

  const sendTemplateNotification = async (template: keyof typeof TEMPLATES) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/send-notification?template=${template}`);
      
      if (response.ok) {
        const result = await response.json();
        alert(`✨ ${TEMPLATES[template].name} notification sent to ${result.sent} subscribers!\n\nActions: ${result.actions?.map((a: any) => a.title).join(', ')}`);
        await loadAnalytics(); // Refresh analytics
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Failed to send notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const sendCustomNotification = async () => {
    if (!customNotification.title.trim() || !customNotification.body.trim()) {
      alert('Please enter both title and message');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: customNotification.title,
        body: customNotification.body,
        template: customNotification.template,
        icon: '/pwa-192x192.png',
        image: customNotification.image || undefined,
        requireInteraction: customNotification.requireInteraction,
        vibrate: customNotification.vibrate ? [200, 100, 200] : [0],
        data: { 
          url: '/', 
          source: 'custom',
          id: `custom_${Date.now()}`
        }
      };

      const response = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ Custom notification sent to ${result.sent} subscribers!\n\nTemplate: ${result.template}\nActions: ${result.actions?.map((a: any) => a.title).join(', ')}`);
        await loadAnalytics();
      } else {
        const error = await response.json();
        alert(`❌ Error: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Failed to send notification: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <h2 className="text-xl font-semibold text-red-800 mb-2">
          ❌ Push Notifications Not Supported
        </h2>
        <p className="text-red-700">
          Your browser doesn't support push notifications. Try using a modern browser like Chrome, Firefox, or Safari.
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-6 max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
        <h2 className="text-3xl font-bold mb-2">🔔 Rich Push Notification Manager</h2>
        <p className="text-gray-600">Send interactive notifications with actions, templates, and analytics</p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-white border rounded-lg shadow-sm">
          <div className="text-3xl mb-2">
            {permission === 'granted' ? '✅' : permission === 'denied' ? '❌' : '⏳'}
          </div>
          <div className="font-semibold">Permission</div>
          <div className="text-sm text-gray-600 capitalize">{permission}</div>
        </div>
        
        <div className="text-center p-4 bg-white border rounded-lg shadow-sm">
          <div className="text-3xl mb-2">{isSubscribed ? '✅' : '❌'}</div>
          <div className="font-semibold">Subscription</div>
          <div className="text-sm text-gray-600">
            {isSubscribed ? 'Active' : 'Not subscribed'}
          </div>
        </div>
        
        <div className="text-center p-4 bg-white border rounded-lg shadow-sm">
          <div className="text-3xl mb-2">👥</div>
          <div className="font-semibold">Subscribers</div>
          <div className="text-sm text-gray-600">{stats?.totalSubscriptions || 0}</div>
        </div>

        <div className="text-center p-4 bg-white border rounded-lg shadow-sm">
          <div className="text-3xl mb-2">📊</div>
          <div className="font-semibold">Engagement</div>
          <div className="text-sm text-gray-600">{analytics?.summary.engagementRate || '0%'}</div>
        </div>
      </div>

      {/* Enable Notifications */}
      {permission !== 'granted' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-blue-800 mb-3">🚀 Get Started</h3>
          <p className="text-blue-700 mb-4">Enable push notifications to start sending rich interactive notifications to your users.</p>
          <button
            onClick={enableNotifications}
            disabled={loading}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Setting up...' : '🔔 Enable Push Notifications'}
          </button>
        </div>
      )}

      {/* Main Content - Only show if notifications are enabled */}
      {permission === 'granted' && (
        <>
          {/* Tab Navigation */}
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div className="border-b border-gray-200">
              <nav className="flex">
                {[
                  { key: 'dashboard', label: '📊 Dashboard', desc: 'Overview & quick actions' },
                  { key: 'templates', label: '🎨 Templates', desc: 'Pre-built notification types' },
                  { key: 'custom', label: '✏️ Custom', desc: 'Create your own notifications' },
                  { key: 'analytics', label: '📈 Analytics', desc: 'Performance & insights' }
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 py-4 px-6 text-center border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.key
                        ? 'border-blue-500 text-blue-600 bg-blue-50'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{tab.desc}</div>
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div className="p-6">
              {/* Dashboard Tab */}
              {activeTab === 'dashboard' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Quick Actions</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        onClick={() => sendTemplateNotification('social')}
                        disabled={loading}
                        className="p-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg font-medium hover:from-pink-600 hover:to-purple-700 disabled:opacity-50"
                      >
                        <div className="text-2xl mb-2">❤️</div>
                        <div>Send Social Notification</div>
                        <div className="text-sm opacity-80">Like • Comment • Share actions</div>
                      </button>
                      
                      <button
                        onClick={() => sendTemplateNotification('message')}
                        disabled={loading}
                        className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-indigo-700 disabled:opacity-50"
                      >
                        <div className="text-2xl mb-2">💬</div>
                        <div>Send Message Notification</div>
                        <div className="text-sm opacity-80">Reply • Archive • Dismiss actions</div>
                      </button>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {analytics && analytics.popularActions.length > 0 && (
                    <div>
                      <h3 className="text-xl font-semibold mb-4">Most Popular Actions</h3>
                      <div className="space-y-2">
                        {analytics.popularActions.slice(0, 3).map((action, index) => (
                          <div key={action.action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="text-2xl">
                                {action.action === 'like' ? '❤️' : 
                                 action.action === 'reply' ? '💬' : 
                                 action.action === 'share' ? '🔗' : 
                                 action.action === 'archive' ? '📂' : '🔔'}
                              </div>
                              <div>
                                <div className="font-medium capitalize">{action.action}</div>
                                <div className="text-sm text-gray-600">{action.count} clicks</div>
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">#{index + 1}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Templates Tab */}
              {activeTab === 'templates' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Notification Templates</h3>
                    <p className="text-gray-600 mb-6">Choose from pre-built templates with different action sets for various use cases.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(TEMPLATES).map(([key, template]) => (
                      <div key={key} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div className="text-3xl mb-3">{template.emoji}</div>
                        <h4 className="font-semibold text-lg mb-2">{template.name}</h4>
                        <p className="text-gray-600 text-sm mb-4">{template.desc}</p>
                        <button
                          onClick={() => sendTemplateNotification(key as keyof typeof TEMPLATES)}
                          disabled={loading}
                          className="w-full bg-gray-800 text-white py-2 px-4 rounded-md font-medium hover:bg-gray-900 disabled:opacity-50"
                        >
                          {loading ? '⏳ Sending...' : '🚀 Send Test'}
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Template Preview */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-semibold text-blue-800 mb-3">💡 Template Benefits</h4>
                    <ul className="text-blue-700 space-y-1 text-sm">
                      <li>• <strong>Rich Actions:</strong> Each template includes 2-3 relevant action buttons</li>
                      <li>• <strong>Optimized UX:</strong> Actions are designed for maximum user engagement</li>
                      <li>• <strong>Analytics Ready:</strong> All interactions are automatically tracked</li>
                      <li>• <strong>Cross-Platform:</strong> Works on desktop, mobile, and tablet browsers</li>
                    </ul>
                  </div>
                </div>
              )}
              {/* Custom Tab */}
              {activeTab === 'custom' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Create Custom Notification</h3>
                    <p className="text-gray-600 mb-6">Build your own notification with custom content and action templates.</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Form */}
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Notification Title
                        </label>
                        <input
                          type="text"
                          value={customNotification.title}
                          onChange={(e) => setCustomNotification(prev => ({ ...prev, title: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter notification title..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message Body
                        </label>
                        <textarea
                          value={customNotification.body}
                          onChange={(e) => setCustomNotification(prev => ({ ...prev, body: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md h-24 resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter notification message..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Action Template
                        </label>
                        <select
                          value={customNotification.template}
                          onChange={(e) => setCustomNotification(prev => ({ ...prev, template: e.target.value as keyof typeof TEMPLATES }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {Object.entries(TEMPLATES).map(([key, template]) => (
                            <option key={key} value={key}>
                              {template.emoji} {template.name} - {template.desc}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image URL (optional)
                        </label>
                        <input
                          type="url"
                          value={customNotification.image}
                          onChange={(e) => setCustomNotification(prev => ({ ...prev, image: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>

                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={customNotification.requireInteraction}
                            onChange={(e) => setCustomNotification(prev => ({ ...prev, requireInteraction: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Require user interaction (notification stays until clicked)</span>
                        </label>

                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={customNotification.vibrate}
                            onChange={(e) => setCustomNotification(prev => ({ ...prev, vibrate: e.target.checked }))}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Enable vibration (mobile devices)</span>
                        </label>
                      </div>

                      <button
                        onClick={sendCustomNotification}
                        disabled={loading}
                        className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? '⏳ Sending...' : '🚀 Send Custom Notification'}
                      </button>
                    </div>

                    {/* Preview */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold mb-3">📱 Preview</h4>
                      <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                        <div className="flex items-start space-x-3">
                          <img src="/pwa-192x192.png" alt="App icon" className="w-8 h-8 rounded" />
                          <div className="flex-1">
                            <div className="font-semibold text-sm">{customNotification.title || 'Notification Title'}</div>
                            <div className="text-gray-600 text-sm mt-1">{customNotification.body || 'Notification message will appear here...'}</div>
                            {customNotification.image && (
                              <div className="mt-2">
                                <img src={customNotification.image} alt="Preview" className="w-full max-w-xs rounded border" />
                              </div>
                            )}
                            <div className="flex space-x-2 mt-3">
                              {TEMPLATES[customNotification.template]?.name === 'Social' && (
                                <>
                                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">❤️ Like</button>
                                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">💬 Comment</button>
                                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">🔗 Share</button>
                                </>
                              )}
                              {TEMPLATES[customNotification.template]?.name === 'Message' && (
                                <>
                                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">💬 Reply</button>
                                  <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">📂 Archive</button>
                                </>
                              )}
                              {TEMPLATES[customNotification.template]?.name === 'Default' && (
                                <button className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">👀 View</button>
                              )}
                              <button className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">❌ Dismiss</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 text-xs text-gray-600 space-y-1">
                        <div>• Template: {TEMPLATES[customNotification.template]?.name}</div>
                        <div>• Interaction: {customNotification.requireInteraction ? 'Required' : 'Optional'}</div>
                        <div>• Vibration: {customNotification.vibrate ? 'Enabled' : 'Disabled'}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Notification Analytics</h3>
                    <p className="text-gray-600 mb-6">Track engagement and performance of your push notifications.</p>
                  </div>

                  {analytics ? (
                    <>
                      {/* Metrics Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-blue-800">{analytics.summary.totalClicks}</div>
                          <div className="text-blue-600 font-medium">Total Clicks</div>
                          <div className="text-xs text-blue-500 mt-1">User interactions with notifications</div>
                        </div>
                        
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-green-800">{analytics.summary.engagementRate}</div>
                          <div className="text-green-600 font-medium">Engagement Rate</div>
                          <div className="text-xs text-green-500 mt-1">Clicks per notification sent</div>
                        </div>
                        
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                          <div className="text-2xl font-bold text-purple-800">{analytics.insights.totalInteractions}</div>
                          <div className="text-purple-600 font-medium">Total Interactions</div>
                          <div className="text-xs text-purple-500 mt-1">All notification actions combined</div>
                        </div>
                      </div>

                      {/* Popular Actions */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="font-semibold text-lg mb-4">🏆 Most Popular Actions</h4>
                        {analytics.popularActions.length > 0 ? (
                          <div className="space-y-3">
                            {analytics.popularActions.map((action, index) => (
                              <div key={action.action} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-800">
                                    #{index + 1}
                                  </div>
                                  <div>
                                    <div className="font-medium capitalize">{action.action}</div>
                                    <div className="text-sm text-gray-600">{action.count} clicks</div>
                                  </div>
                                </div>
                                <div className="text-2xl">
                                  {action.action === 'like' ? '❤️' : 
                                   action.action === 'reply' ? '💬' : 
                                   action.action === 'share' ? '🔗' : 
                                   action.action === 'archive' ? '📂' : 
                                   action.action === 'open' ? '👀' : '🔔'}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <div className="text-4xl mb-2">📊</div>
                            <div>No analytics data yet</div>
                            <div className="text-sm">Send some notifications to see engagement metrics</div>
                          </div>
                        )}
                      </div>

                      {/* Insights */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                        <h4 className="font-semibold text-yellow-800 mb-3">💡 Insights</h4>
                        <div className="text-yellow-700 space-y-2 text-sm">
                          <div>• Most engaging action: <strong>{analytics.insights.mostEngaging || 'N/A'}</strong></div>
                          <div>• Total interactions: <strong>{analytics.insights.totalInteractions}</strong></div>
                          <div>• Average daily actions: <strong>{analytics.insights.averageActionsPerDay || 0}</strong></div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">⏳</div>
                      <div>Loading analytics...</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* API Documentation */}
      <div className="bg-gray-900 text-white rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4">🔧 API Examples</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium mb-2 text-blue-300">Send Social Notification:</h4>
            <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`curl -X POST http://localhost:4321/api/send-notification \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "❤️ New Like!",
    "body": "Someone liked your photo",
    "template": "social",
    "image": "/pwa-512x512.png"
  }'`}
            </pre>
          </div>
          
          <div>
            <h4 className="font-medium mb-2 text-green-300">Test Template:</h4>
            <pre className="bg-gray-800 p-3 rounded text-sm overflow-x-auto">
{`curl http://localhost:4321/api/send-notification?template=message`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
