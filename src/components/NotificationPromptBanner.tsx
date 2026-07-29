import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  sendPushNotification,
} from '../lib/notifications';
import { Bell, Check } from 'lucide-react';

export const NotificationPromptBanner: React.FC = () => {
  const { showToast } = useApp();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const perm = getNotificationPermission();
    const isDismissed = localStorage.getItem('task_buddy_notif_banner_dismissed') === 'true';

    if (perm === 'default' && !isDismissed) {
      // Delay prompt slightly so user lands smoothly on dashboard
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  const handleEnable = async () => {
    const granted = await requestNotificationPermission();
    setIsVisible(false);
    if (granted) {
      sendPushNotification('🎉 Notifications Activated!', {
        body: 'Task Buddy will alert you about today\'s deadlines and task summaries.',
      });
      showToast('Notifications enabled successfully!', 'success');
    } else {
      showToast('Notification permission was blocked in browser settings', 'error');
    }
  };

  const handleDismiss = () => {
    localStorage.setItem('task_buddy_notif_banner_dismissed', 'true');
    setIsVisible(false);
  };

  return (
    <div className="mb-6 neu-raised rounded-neu-card p-4 sm:p-5 border-l-4 border-[#6C63FF] relative animate-fade-in transition-all overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-start space-x-3.5 flex-1">
          <div className="w-10 h-10 rounded-full neu-raised flex items-center justify-center text-[#6C63FF] flex-shrink-0 mt-0.5 sm:mt-0">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-gray-800 flex items-center gap-1.5">
              Enable Daily Task Reminders & Notifications
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#6C63FF]/10 text-[#6C63FF]">
                Recommended
              </span>
            </h4>
            <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
              Never miss a deadline! Turn on notifications to receive daily morning task digests and real-time deadline alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-0 border-gray-300/30">
          <button
            onClick={handleDismiss}
            className="px-3.5 py-2 neu-raised neu-button rounded-neu-btn text-xs font-semibold text-gray-500 hover:text-gray-700"
          >
            Maybe Later
          </button>

          <button
            onClick={handleEnable}
            className="neu-accent-button px-4 py-2 rounded-neu-btn text-xs font-bold flex items-center gap-1.5 shadow-sm"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            Enable Notifications
          </button>
        </div>

      </div>
    </div>
  );
};
