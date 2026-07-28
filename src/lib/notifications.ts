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

// Check for upcoming or overdue tasks and send reminders
export const checkTaskDeadlinesAndNotify = (tasks: Array<{ id: string; title: string; due_date?: string | null; is_completed: boolean }>) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

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
        sendPushNotification(`⏰ Upcoming Task Reminder`, {
          body: `"${task.title}" is due in ${Math.ceil(minutesDiff)} minutes!`,
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
