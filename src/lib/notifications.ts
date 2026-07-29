// Browser Web Push Notification Utility for Task Buddy
// Routes all notifications through the Service Worker for reliable delivery

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
          minInterval: 6 * 60 * 60 * 1000,
        });
        console.log('[Task Buddy] Periodic background sync registered');
      }
    }
  } catch (error) {
    console.log('[Task Buddy] Periodic sync not available, using in-app fallback');
  }
};

// ─── Core notification sender ──────────────────────────────
export const sendPushNotification = async (
  title: string,
  options?: { body?: string; tag?: string; url?: string }
) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    if (isServiceWorkerSupported()) {
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
        return;
      }
    }

    // Fallback: direct Notification API
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

// ─── Helper: get today's date key (YYYY-MM-DD) ────────────
function getTodayKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// ─── Helper: check if a date is today ──────────────────────
function isToday(dateStr: string): boolean {
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// ─── Helper: check if a date is tomorrow ───────────────────
function isTomorrow(dateStr: string): boolean {
  const date = new Date(dateStr);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

// ─── DAILY MORNING DIGEST ──────────────────────────────────
// Shows once per day on the first app visit with a summary of today's tasks
export const showDailyMorningDigest = (
  tasks: Array<{ id: string; title: string; due_date?: string | null; is_completed: boolean }>
) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const DAILY_KEY = 'task_buddy_last_daily_digest';
  const todayKey = getTodayKey();
  const lastDigestDate = localStorage.getItem(DAILY_KEY);

  // Already shown today
  if (lastDigestDate === todayKey) return;

  // Find tasks due today (not completed)
  const todaysTasks = tasks.filter(
    (t) => !t.is_completed && t.due_date && isToday(t.due_date)
  );

  // Find overdue tasks
  const overdueTasks = tasks.filter((t) => {
    if (t.is_completed || !t.due_date) return false;
    return new Date(t.due_date).getTime() < new Date().setHours(0, 0, 0, 0);
  });

  // Find tasks due tomorrow
  const tomorrowTasks = tasks.filter(
    (t) => !t.is_completed && t.due_date && isTomorrow(t.due_date)
  );

  // Find all incomplete tasks (no due date)
  const pendingCount = tasks.filter((t) => !t.is_completed).length;

  // Build the notification body
  const parts: string[] = [];

  if (overdueTasks.length > 0) {
    parts.push(`🚨 ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? 's' : ''}`);
  }

  if (todaysTasks.length > 0) {
    const taskNames = todaysTasks.slice(0, 3).map((t) => `"${t.title}"`).join(', ');
    const extra = todaysTasks.length > 3 ? ` +${todaysTasks.length - 3} more` : '';
    parts.push(`📋 Today: ${taskNames}${extra}`);
  } else {
    parts.push('✅ No tasks due today');
  }

  if (tomorrowTasks.length > 0) {
    parts.push(`📅 ${tomorrowTasks.length} task${tomorrowTasks.length > 1 ? 's' : ''} due tomorrow`);
  }

  if (pendingCount > 0) {
    parts.push(`📝 ${pendingCount} total pending task${pendingCount > 1 ? 's' : ''}`);
  }

  const body = parts.join('\n');

  // Determine title based on time of day
  const hour = new Date().getHours();
  let greeting = '📌 Good morning!';
  if (hour >= 12 && hour < 17) greeting = '📌 Good afternoon!';
  if (hour >= 17) greeting = '📌 Good evening!';

  sendPushNotification(`${greeting} Here's your daily plan`, {
    body,
    tag: 'daily-morning-digest',
  });

  localStorage.setItem(DAILY_KEY, todayKey);
};

// ─── DEADLINE NOTIFICATIONS ────────────────────────────────
// Checks for upcoming and overdue tasks and sends targeted reminders
export const checkTaskDeadlinesAndNotify = (
  tasks: Array<{ id: string; title: string; due_date?: string | null; is_completed: boolean }>
) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  // Show daily digest on first visit each day
  showDailyMorningDigest(tasks);

  const now = new Date();
  const notifiedTasksKey = 'task_buddy_notified_tasks';
  const notifiedTasks: Record<string, number> = JSON.parse(
    localStorage.getItem(notifiedTasksKey) || '{}'
  );

  // Clean up old notification records (older than 48 hours)
  const TWO_DAYS_MS = 48 * 60 * 60 * 1000;
  Object.keys(notifiedTasks).forEach((key) => {
    if (Date.now() - notifiedTasks[key] > TWO_DAYS_MS) {
      delete notifiedTasks[key];
    }
  });

  tasks.forEach((task) => {
    if (task.is_completed || !task.due_date) return;

    const dueDate = new Date(task.due_date);
    const timeDiffMs = dueDate.getTime() - now.getTime();
    const minutesDiff = timeDiffMs / (1000 * 60);
    const hoursDiff = minutesDiff / 60;

    // ─── Due within 1 hour ─────────────────────────────
    if (minutesDiff > 0 && minutesDiff <= 60) {
      const notifKey = `upcoming-${task.id}`;
      const lastNotified = notifiedTasks[notifKey];

      // Don't re-notify within 30 minutes
      if (!lastNotified || Date.now() - lastNotified > 30 * 60 * 1000) {
        const timeFormatted = dueDate.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        });

        if (minutesDiff <= 15) {
          sendPushNotification('🔴 Task Due Very Soon!', {
            body: `"${task.title}" is due at ${timeFormatted} — only ${Math.ceil(minutesDiff)} minutes left!`,
            tag: `task-urgent-${task.id}`,
          });
        } else {
          sendPushNotification('⏰ Upcoming Task Reminder', {
            body: `"${task.title}" is due at ${timeFormatted} (in ${Math.ceil(minutesDiff)} minutes)`,
            tag: `task-reminder-${task.id}`,
          });
        }
        notifiedTasks[notifKey] = Date.now();
      }
    }

    // ─── Due within 2-4 hours (early warning) ──────────
    if (hoursDiff > 1 && hoursDiff <= 4) {
      const notifKey = `early-${task.id}`;
      const lastNotified = notifiedTasks[notifKey];

      // Only notify once for this range
      if (!lastNotified) {
        sendPushNotification('📅 Task Due Today', {
          body: `"${task.title}" is due in about ${Math.ceil(hoursDiff)} hours. Plan ahead!`,
          tag: `task-today-${task.id}`,
        });
        notifiedTasks[notifKey] = Date.now();
      }
    }

    // ─── Overdue (within last 4 hours) ─────────────────
    if (minutesDiff < 0 && Math.abs(minutesDiff) <= 240) {
      const notifKey = `overdue-${task.id}`;
      const lastNotified = notifiedTasks[notifKey];

      // Re-notify every 2 hours for overdue tasks
      if (!lastNotified || Date.now() - lastNotified > 2 * 60 * 60 * 1000) {
        const overdueMins = Math.abs(Math.ceil(minutesDiff));
        const overdueText =
          overdueMins >= 60
            ? `${Math.floor(overdueMins / 60)}h ${overdueMins % 60}m`
            : `${overdueMins} minutes`;

        sendPushNotification('🚨 Overdue Task!', {
          body: `"${task.title}" is overdue by ${overdueText}. Don't let it slip!`,
          tag: `task-overdue-${task.id}`,
        });
        notifiedTasks[notifKey] = Date.now();
      }
    }
  });

  localStorage.setItem(notifiedTasksKey, JSON.stringify(notifiedTasks));
};
