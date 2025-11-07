/* eslint-env serviceworker */
/* eslint-disable no-undef, @typescript-eslint/no-unused-vars, no-console */

// Custom Service Worker for Daily Check-In Notifications
// This worker handles scheduled notifications and click events

const NOTIFICATION_TAG = 'daily-checkin-reminder';

// Listen for messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SCHEDULE_NOTIFICATION') {
    const { scheduledTime, enabled } = event.data;

    if (enabled && scheduledTime) {
      scheduleNextNotification(scheduledTime);
    } else {
      cancelScheduledNotifications();
    }
  }
});

// Schedule the next notification
async function scheduleNextNotification(timeString) {
  try {
    // Parse time string (format: "HH:MM")
    const [hours, minutes] = timeString.split(':').map(Number);

    // Calculate next notification time
    const now = new Date();
    const scheduledDate = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      hours,
      minutes,
      0,
      0
    );

    // If the time has passed today, schedule for tomorrow
    if (scheduledDate <= now) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    const timeUntilNotification = scheduledDate.getTime() - now.getTime();

    // Store the scheduled time
    await self.registration.showNotification('Debug', {
      body: `Next notification scheduled for ${scheduledDate.toLocaleString()}`,
      tag: 'schedule-debug',
      requireInteraction: false,
      silent: true,
    });

    // Close debug notification immediately
    setTimeout(() => {
      self.registration.getNotifications({ tag: 'schedule-debug' }).then((notifications) => {
        notifications.forEach((notification) => notification.close());
      });
    }, 100);

    // Schedule the notification using setTimeout (will be replaced by more robust solution)
    // Note: Service workers can be terminated, so we'll also check on activation
    setTimeout(() => {
      showCheckInNotification();
    }, timeUntilNotification);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

// Show the check-in notification
async function showCheckInNotification() {
  try {
    // Close any existing notifications with the same tag
    const existingNotifications = await self.registration.getNotifications({
      tag: NOTIFICATION_TAG,
    });
    existingNotifications.forEach((notification) => notification.close());

    // Show the new notification
    await self.registration.showNotification('Daily Well-Being Check-In', {
      body: 'How are you feeling today? Take a moment to check in with yourself.',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: NOTIFICATION_TAG,
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        url: '/check-in',
        timestamp: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'Check In Now',
        },
        {
          action: 'dismiss',
          title: 'Later',
        },
      ],
    });

    // Schedule the next notification for tomorrow
    // The main app will re-schedule with the correct time
  } catch (error) {
    console.error('Error showing notification:', error);
  }
}

// Cancel scheduled notifications
async function cancelScheduledNotifications() {
  try {
    const notifications = await self.registration.getNotifications({
      tag: NOTIFICATION_TAG,
    });
    notifications.forEach((notification) => notification.close());
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/check-in';

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            // Focus the existing window and navigate to check-in
            return client.focus().then(() => {
              if ('navigate' in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }

        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  // Track dismissals if needed for analytics
  console.log('Notification dismissed:', event.notification.tag);
});

// Activate event - check for pending notifications
self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.clients.claim().then(() => {
      // Notify all clients that the service worker is ready
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_ACTIVATED',
            timestamp: Date.now(),
          });
        });
      });
    })
  );
});

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
});
