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
  } else if (event.data && event.data.type === 'CHECK_NOTIFICATION') {
    // Periodic check from the main app
    checkAndShowNotificationIfNeeded();
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

    // Store the scheduled time in IndexedDB for persistence
    try {
      const db = await openNotificationDB();
      const tx = db.transaction('schedules', 'readwrite');
      await tx.store.put({
        id: 'daily-checkin',
        scheduledTime: timeString,
        nextNotificationTime: scheduledDate.toISOString(),
        createdAt: now.toISOString(),
      });
    } catch (dbError) {
      console.error('Error storing schedule in IndexedDB:', dbError);
    }

    // Schedule the notification using setTimeout
    // This will fire if the service worker stays alive
    setTimeout(() => {
      showCheckInNotification();
    }, timeUntilNotification);
  } catch (error) {
    console.error('Error scheduling notification:', error);
  }
}

// Open IndexedDB for storing schedules
async function openNotificationDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('NotificationDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('schedules')) {
        db.createObjectStore('schedules', { keyPath: 'id' });
      }
    };
  });
}

// Check if it's time to show the notification
async function checkAndShowNotificationIfNeeded() {
  try {
    const db = await openNotificationDB();
    const tx = db.transaction('schedules', 'readonly');
    const schedule = await tx.store.get('daily-checkin');

    if (!schedule) {
      return;
    }

    const now = new Date();
    const nextNotificationTime = new Date(schedule.nextNotificationTime);

    // If the scheduled time has passed, show the notification
    if (now >= nextNotificationTime) {
      await showCheckInNotification();

      // Schedule for tomorrow
      const tomorrow = new Date(nextNotificationTime);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const updateTx = db.transaction('schedules', 'readwrite');
      await updateTx.store.put({
        ...schedule,
        nextNotificationTime: tomorrow.toISOString(),
      });
    }
  } catch (error) {
    console.error('Error checking notification schedule:', error);
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
    self.clients.claim().then(async () => {
      // Check if there's a pending notification that should be shown
      await checkAndShowNotificationIfNeeded();

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
