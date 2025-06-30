// src/pwa.ts
import { registerSW } from 'virtual:pwa-register'

// Your VAPID public key
const VAPID_PUBLIC_KEY = 'BNajTcd4-YDohjXE8Zfk9KQ7Gpke346nTTUX6bVFOtrUCfw7vTVEmcLK1onMxF_9RCHmLDaYC7SiV_7XCTfYOUE'

// Convert VAPID key to Uint8Array
function urlB64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/')

  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// Register service worker
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, r) {
    console.log(`🔧 Service Worker registered: ${swUrl}`)
    
    // Set up push notifications after SW is registered
    if (r) {
      setupPushNotifications(r)
    }
  },
  onOfflineReady() {
    console.log('📱 PWA ready to work offline')
    showNotification('App ready for offline use!', 'success')
  },
  onNeedRefresh() {
    console.log('🔄 New content available')
    showNotification('New version available! Click to update.', 'info', () => {
      updateSW(true)
    })
  },
  onRegisterError(error) {
    console.error('❌ Service Worker registration error:', error)
  }
})

// Set up push notifications
async function setupPushNotifications(registration: ServiceWorkerRegistration) {
  try {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return
    }

    // Check if push messaging is supported
    if (!('PushManager' in window)) {
      console.warn('This browser does not support push messaging')
      return
    }

    // Check current permission status
    let permission = Notification.permission
    
    if (permission === 'default') {
      // Don't ask immediately - wait for user interaction
      addNotificationButton()
    } else if (permission === 'granted') {
      await subscribeToPush(registration)
    }
    
  } catch (error) {
    console.error('Error setting up push notifications:', error)
  }
}

// Add a button to enable notifications (better UX than asking immediately)
function addNotificationButton() {
  // Only add if not already added
  if (document.getElementById('enable-notifications-btn')) return
  
  const button = document.createElement('button')
  button.id = 'enable-notifications-btn'
  button.innerHTML = '🔔 Enable Notifications'
  button.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1000;
    padding: 12px 16px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  `
  
  button.addEventListener('click', async () => {
    const registration = await navigator.serviceWorker.ready
    await requestNotificationPermission(registration)
    button.remove()
  })
  
  document.body.appendChild(button)
}

// Request notification permission
async function requestNotificationPermission(registration: ServiceWorkerRegistration) {
  try {
    const permission = await Notification.requestPermission()
    
    if (permission === 'granted') {
      console.log('✅ Notification permission granted')
      await subscribeToPush(registration)
      showNotification('Notifications enabled!', 'success')
    } else {
      console.log('❌ Notification permission denied')
      showNotification('Notifications disabled', 'error')
    }
  } catch (error) {
    console.error('Error requesting notification permission:', error)
  }
}

// Subscribe to push notifications
async function subscribeToPush(registration: ServiceWorkerRegistration) {
  try {
    // Check if already subscribed
    const existingSubscription = await registration.pushManager.getSubscription()
    
    if (existingSubscription) {
      console.log('📱 Already subscribed to push notifications')
      await sendSubscriptionToServer(existingSubscription)
      return
    }

    // Subscribe to push notifications
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(VAPID_PUBLIC_KEY)
    })

    console.log('📱 Subscribed to push notifications:', subscription)
    
    // Send subscription to your server
    await sendSubscriptionToServer(subscription)
    
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error)
  }
}

// Send subscription to your server
async function sendSubscriptionToServer(subscription: PushSubscription) {
  try {
    const response = await fetch('/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    console.log('✅ Subscription sent to server')
  } catch (error) {
    console.error('Failed to send subscription to server:', error)
  }
}

// Utility function to show in-app notifications
function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info', onClick?: () => void) {
  const notification = document.createElement('div')
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 1001;
    padding: 16px;
    border-radius: 8px;
    color: white;
    font-weight: 500;
    cursor: ${onClick ? 'pointer' : 'default'};
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `
  notification.textContent = message
  
  if (onClick) {
    notification.addEventListener('click', onClick)
  }
  
  document.body.appendChild(notification)
  
  // Animate in
  setTimeout(() => {
    notification.style.transform = 'translateX(0)'
  }, 100)
  
  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)'
    setTimeout(() => notification.remove(), 300)
  }, 5000)
}

// Global functions for external use
window.enableNotifications = async () => {
  const registration = await navigator.serviceWorker.ready
  await requestNotificationPermission(registration)
}

window.sendTestNotification = async () => {
  try {
    const response = await fetch('/api/send-notification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Test Notification',
        body: 'This is a test from your PWA!',
        icon: '/pwa-192x192.png'
      })
    })
    
    if (response.ok) {
      showNotification('Test notification sent!', 'success')
    }
  } catch (error) {
    console.error('Failed to send test notification:', error)
    showNotification('Failed to send notification', 'error')
  }
}
