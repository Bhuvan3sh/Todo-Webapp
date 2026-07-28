// Browser Web Push Notification Utility for Task Buddy

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
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

export const sendPushNotification = (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return;
  }

  try {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  } catch (e) {
    console.error('Error triggering notification:', e);
  }
};

// Periodic Check-in Notification (Every 5 to 8 hours)
export const checkPeriodicAppReminder = () => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const PERIODIC_KEY = 'task_buddy_last_periodic_reminder';
  const lastReminder = localStorage.getItem(PERIODIC_KEY);
  const now = Date.now();

  // 6 hours in milliseconds (21,600,000 ms)
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

    // If task is overdue today and hasn't been notified yet
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
