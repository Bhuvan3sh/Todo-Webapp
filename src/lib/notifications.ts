// Browser Web Push Notification Utility for Task Buddy
// Uses Service Worker for background notifications on Android PWA

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

// Register Service Worker for background push notifications
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

// Register periodic background sync (for 5-8 hour check-in reminders)
export const registerPeriodicSync = async () => {
  if (!isServiceWorkerSupported()) return;

  try {
    const registration = await navigator.serviceWorker.ready;

    // Check if Periodic Background Sync API is available
    if ('periodicSync' in registration) {
      const status = await navigator.permissions.query({
        name: 'periodic-background-sync' as any,
      });

      if (status.state === 'granted') {
        await (registration as any).periodicSync.register('task-buddy-checkin', {
          minInterval: 6 * 60 * 60 * 1000, // 6 hours (browser may adjust between 5-8h)
        });
        console.log('[Task Buddy] Periodic background sync registered (6h interval)');
      }
    }
  } catch (error) {
    console.log('[Task Buddy] Periodic sync not available, falling back to in-app timer');
  }
};

// Send notification via Service Worker (works in background on Android PWA)
export const sendPushNotification = async (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    // Prefer Service Worker notification (works in background on Android)
    if (isServiceWorkerSupported()) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });
    } else {
      // Fallback to basic Notification API (foreground only)
      const notification = new Notification(title, {
        icon: '/favicon.svg',
        badge: '/favicon.svg',
        ...options,
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  } catch (e) {
    console.error('Error triggering notification:', e);
  }
};

// Periodic Check-in Notification (Every ~6 hours, fallback for no periodic sync)
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

  // Run periodic 5-8 hour check-in reminder
  checkPeriodicAppReminder();

  const now = new Date();
  const notifiedTasksKey = 'task_buddy_notified_tasks';
  const notifiedTasks: Record<string, number> = JSON.parse(localStorage.getItem(notifiedTasksKey) || '{}');

  tasks.forEach((task) => {
    if (task.is_completed || !task.due_date) return;

    const dueDate = new Date(task.due_date);
    const timeDiffMs = dueDate.getTime() - now.getTime();
    const minutesDiff = timeDiffMs / (1000 * 60);

    // If task is due within 30 minutes and hasn't been notified in the last 2 hours
    if (minutesDiff > 0 && minutesDiff <= 30) {
      const lastNotified = notifiedTasks[task.id];
      if (!lastNotified || Date.now() - lastNotified > 2 * 60 * 60 * 1000) {
        const timeFormatted = dueDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        sendPushNotification(`⏰ Upcoming Task Reminder`, {
          body: `"${task.title}" is due at ${timeFormatted} (in ${Math.ceil(minutesDiff)} minutes)!`,
          tag: `task-reminder-${task.id}`,
        });
        notifiedTasks[task.id] = Date.now();
      }
    }

    // If task is overdue and hasn't been notified yet
    if (minutesDiff < 0 && Math.abs(minutesDiff) <= 120) {
      const lastNotified = notifiedTasks[task.id];
      if (!lastNotified || Date.now() - lastNotified > 4 * 60 * 60 * 1000) {
        sendPushNotification(`🚨 Overdue Task Alert`, {
          body: `"${task.title}" was due recently. Take a moment to complete it!`,
          tag: `task-overdue-${task.id}`,
        });
        notifiedTasks[task.id] = Date.now();
      }
    }
  });

  localStorage.setItem(notifiedTasksKey, JSON.stringify(notifiedTasks));
};
