// Browser Web Push Notification Utility for Task Buddy
// Routes all notifications through the Service Worker for reliable delivery
// on both desktop and Android PWA (avoids Chrome's "tap to copy link" bug)

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const isServiceWorkerSupported = (): boolean => {
  return typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('[Task Buddy] Error requesting notification permission:', error);
    return false;
  }
};

// Register Service Worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!isServiceWorkerSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    // Wait for the SW to be active
    if (registration.installing) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing!;
        sw.addEventListener('statechange', () => {
          if (sw.state === 'activated') resolve();
        });
      });
    }

    console.log('[Task Buddy] Service Worker registered and active');
    return registration;
  } catch (error) {
    console.error('[Task Buddy] Service Worker registration failed:', error);
    return null;
  }
};

// Register periodic background sync
export const registerPeriodicSync = async () => {
  if (!isServiceWorkerSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;

    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any,
      });

      if (status.state === 'granted') {
        await (registration as any).periodicSync.register('task-buddy-checkin', {
          minInterval: 6 * 60 * 60 * 1000, // 6 hours
        });
        console.log('[Task Buddy] Periodic background sync registered');
      }
    }
  } catch (error) {
    console.log('[Task Buddy] Periodic sync not available, using in-app fallback');
  }
};

// Send notification via Service Worker
// The SW calls showNotification from its context — this avoids
// Chrome Android's silent notification / "tap to copy link" bug
export const sendPushNotification = async (
  title: string,
  options?: { body?: string; tag?: string; url?: string }
) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    if (isServiceWorkerSupported()) {
      // Ensure SW is ready and active
      const registration = await navigator.serviceWorker.ready;

      if (registration.active) {
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: {
            body: options?.body || '',
            tag: options?.tag || 'task-buddy-' + Date.now(),
            url: options?.url || '/dashboard',
          },
        });
        return; // Success — SW will handle it
      }
    }

    // Fallback: direct Notification API (works in foreground only)
    new Notification(title, {
      body: options?.body || '',
      icon: '/icon-192.png',
      tag: options?.tag || 'task-buddy-' + Date.now(),
      requireInteraction: true,
      silent: false,
    });
  } catch (e) {
    console.error('[Task Buddy] Notification error:', e);
  }
};

// ─── Periodic Check-in (in-app fallback every 6 hours) ────
export const checkPeriodicAppReminder = () => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const PERIODIC_KEY = 'task_buddy_last_periodic_reminder';
  const lastReminder = localStorage.getItem(PERIODIC_KEY);
  const now = Date.now();
  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

  if (!lastReminder || now - parseInt(lastReminder, 10) >= SIX_HOURS_MS) {
    sendPushNotification('📌 Task Buddy Check-in', {
      body: 'Take a quick moment to review your pending tasks and keep your momentum going! 🚀',
      tag: 'periodic-app-reminder',
    });
    localStorage.setItem(PERIODIC_KEY, now.toString());
  }
};

// ─── Task deadline checker ─────────────────────────────────
export const checkTaskDeadlinesAndNotify = (
  tasks: Array<{ id: string; title: string; due_date?: string | null; is_completed: boolean }>
) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  // Also run the periodic app reminder
  checkPeriodicAppReminder();

  const now = new Date();
  const notifiedTasksKey = 'task_buddy_notified_tasks';
  const notifiedTasks: Record<string, number> = JSON.parse(
    localStorage.getItem(notifiedTasksKey) || '{}'
  );

  tasks.forEach((task) => {
    if (task.is_completed || !task.due_date) return;

    const dueDate = new Date(task.due_date);
    const timeDiffMs = dueDate.getTime() - now.getTime();
    const minutesDiff = timeDiffMs / (1000 * 60);

    // Due within 30 minutes
    if (minutesDiff > 0 && minutesDiff <= 30) {
      const lastNotified = notifiedTasks[task.id];
      if (!lastNotified || Date.now() - lastNotified > 2 * 60 * 60 * 1000) {
        const timeFormatted = dueDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });
        sendPushNotification('⏰ Upcoming Task Reminder', {
          body: `"${task.title}" is due at ${timeFormatted} (in ${Math.ceil(minutesDiff)} minutes)!`,
          tag: `task-reminder-${task.id}`,
        });
        notifiedTasks[task.id] = Date.now();
      }
    }

    // Overdue (within last 2 hours)
    if (minutesDiff < 0 && Math.abs(minutesDiff) <= 120) {
      const lastNotified = notifiedTasks[task.id];
      if (!lastNotified || Date.now() - lastNotified > 4 * 60 * 60 * 1000) {
        sendPushNotification('🚨 Overdue Task Alert', {
          body: `"${task.title}" was due recently. Take a moment to complete it!`,
          tag: `task-overdue-${task.id}`,
        });
        notifiedTasks[task.id] = Date.now();
      }
    }
  });

  localStorage.setItem(notifiedTasksKey, JSON.stringify(notifiedTasks));
};
