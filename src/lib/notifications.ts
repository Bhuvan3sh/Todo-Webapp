// Browser Web Push Notification Utility for Task Buddy
// Sends messages to Service Worker which shows the actual notification

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
    console.error('Error requesting notification permission:', error);
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
    console.log('[Task Buddy] Service Worker registered:', registration.scope);
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
          minInterval: 6 * 60 * 60 * 1000,
        });
        console.log('[Task Buddy] Periodic background sync registered (6h interval)');
      }
    }
  } catch (error) {
    console.log('[Task Buddy] Periodic sync not available, falling back to in-app timer');
  }
};

// Send notification by posting a message to the Service Worker
// The SW shows the notification from its own context — this avoids
// Chrome Android's "tap to copy link" silent notification bug
export const sendPushNotification = async (title: string, options?: { body?: string; tag?: string }) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    if (isServiceWorkerSupported()) {
      const registration = await navigator.serviceWorker.ready;

      if (registration.active) {
        // Post message to SW — it will call showNotification from its own context
        registration.active.postMessage({
          type: 'SHOW_NOTIFICATION',
          title,
          options: {
            body: options?.body || '',
            tag: options?.tag || 'task-buddy-' + Date.now(),
          },
        });
      }
    } else {
      // Last resort fallback — basic Notification API (foreground only)
      new Notification(title, {
        body: options?.body || '',
        icon: '/favicon.svg',
      });
    }
  } catch (e) {
    console.error('Error triggering notification:', e);
  }
};

// Periodic Check-in Notification (Every ~6 hours fallback)
export const checkPeriodicAppReminder = () => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const PERIODIC_KEY = 'task_buddy_last_periodic_reminder';
  const lastReminder = localStorage.getItem(PERIODIC_KEY);
  const now = Date.now();

  const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

  if (!lastReminder || now - parseInt(lastReminder, 10) >= SIX_HOURS_MS) {
    sendPushNotification('📌 Task Buddy Check-in', {
      body: 'Take a quick moment to review your pending tasks and keep your momentum going today! 🚀',
      tag: 'periodic-app-reminder',
    });
    localStorage.setItem(PERIODIC_KEY, now.toString());
  }
};

// Check for upcoming or overdue tasks and send reminders
export const checkTaskDeadlinesAndNotify = (tasks: Array<{ id: string; title: string; due_date?: string | null; is_completed: boolean }>) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  checkPeriodicAppReminder();

  const now = new Date();
  const notifiedTasksKey = 'task_buddy_notified_tasks';
  const notifiedTasks: Record<string, number> = JSON.parse(localStorage.getItem(notifiedTasksKey) || '{}');

  tasks.forEach((task) => {
    if (task.is_completed || !task.due_date) return;

    const dueDate = new Date(task.due_date);
    const timeDiffMs = dueDate.getTime() - now.getTime();
    const minutesDiff = timeDiffMs / (1000 * 60);

    // If task is due within 30 minutes
    if (minutesDiff > 0 && minutesDiff <= 30) {
      const lastNotified = notifiedTasks[task.id];
      if (!lastNotified || Date.now() - lastNotified > 2 * 60 * 60 * 1000) {
        const timeFormatted = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sendPushNotification('⏰ Upcoming Task Reminder', {
          body: `"${task.title}" is due at ${timeFormatted} (in ${Math.ceil(minutesDiff)} minutes)!`,
          tag: `task-reminder-${task.id}`,
        });
        notifiedTasks[task.id] = Date.now();
      }
    }

    // If task is overdue
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
