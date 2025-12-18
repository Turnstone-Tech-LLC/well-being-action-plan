/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

import { build, files, version } from '$service-worker';

// Create a unique cache name for this deployment
const CACHE = `cache-${version}`;

// Assets to cache immediately on install
const ASSETS = [
	...build, // the app itself
	...files // everything in `static`
];

/**
 * Install event - cache all assets
 */
self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE)
			.then((cache) => cache.addAll(ASSETS))
			.then(() => {
				self.skipWaiting();
			})
	);
});

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then(async (keys) => {
			// Delete old caches
			for (const key of keys) {
				if (key !== CACHE) {
					await caches.delete(key);
				}
			}
			// Take control of all clients immediately
			self.clients.claim();
		})
	);
});

/**
 * Fetch event - serve from cache, falling back to network
 */
self.addEventListener('fetch', (event) => {
	// Skip cross-origin requests
	if (!event.request.url.startsWith(self.location.origin)) {
		return;
	}

	// Skip API requests
	if (event.request.url.includes('/api/')) {
		return;
	}

	// For navigation requests, try network first, then cache
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch(() => {
				return caches.match(event.request).then((cached) => {
					return cached || caches.match('/');
				}) as Promise<Response>;
			})
		);
		return;
	}

	// For other requests, try cache first, then network
	event.respondWith(
		caches.match(event.request).then((cached) => {
			if (cached) {
				return cached;
			}

			return fetch(event.request).then((response) => {
				// Don't cache non-successful responses
				if (!response.ok) {
					return response;
				}

				// Clone the response since we need to use it twice
				const responseToCache = response.clone();

				caches.open(CACHE).then((cache) => {
					cache.put(event.request, responseToCache);
				});

				return response;
			});
		}) as Promise<Response>
	);
});

/**
 * Push notification event - show notification
 */
self.addEventListener('push', (event) => {
	const data = event.data?.json() ?? {};

	const title = data.title || 'Well-Being Check-In';
	const options: NotificationOptions = {
		body: data.body || 'How are you feeling today? Take a moment to check in with yourself.',
		icon: '/icons/icon-192.png',
		badge: '/icons/badge-72.png',
		tag: 'checkin-reminder',
		data: {
			url: data.url || '/app/checkin'
		},
		requireInteraction: false,
		silent: false
	};

	event.waitUntil(self.registration.showNotification(title, options));
});

/**
 * Notification click event - open the app
 */
self.addEventListener('notificationclick', (event) => {
	event.notification.close();

	const url = event.notification.data?.url || '/app';

	event.waitUntil(
		self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
			// Check if there's already a window open
			for (const client of clientList) {
				if (client.url.includes(self.location.origin) && 'focus' in client) {
					client.focus();
					client.navigate(url);
					return;
				}
			}
			// If no window is open, open a new one
			if (self.clients.openWindow) {
				return self.clients.openWindow(url);
			}
		})
	);
});

/**
 * Notification close event - track when user dismisses notification
 */
self.addEventListener('notificationclose', (event) => {
	// Could be used to track notification dismissals
	console.log('Notification dismissed:', event.notification.tag);
});

/**
 * Message event - handle messages from the main thread
 */
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	// Handle show notification request
	if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
		const { title, options } = event.data;
		self.registration.showNotification(title, {
			icon: '/icons/icon-192.png',
			badge: '/icons/badge-72.png',
			tag: 'checkin-reminder',
			...options
		});
	}
});
