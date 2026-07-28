import React from 'react';
import { useApp } from '../context/AppContext';
import { Command, X } from 'lucide-react';

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsModalOpen, setIsShortcutsModalOpen } = useApp();

  if (!isShortcutsModalOpen) return null;

  const shortcuts = [
    { key: 'N', description: 'Create a new task' },
    { key: 'L', description: 'Create a new list' },
    { key: '/', description: 'Focus search bar in top navbar' },
    { key: 'Esc', description: 'Close any open modal dialog' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md neu-raised rounded-neu-card p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-gray-300/30 dark:border-gray-800/50">
          <div className="flex items-center space-x-2">
            <Command className="w-5 h-5 text-[#6C63FF]" />
            <h3 className="text-base font-bold text-gray-800 dark:text-white">
              Keyboard Shortcuts
            </h3>
          </div>
          <button
            onClick={() => setIsShortcutsModalOpen(false)}
            className="w-8 h-8 rounded-full neu-raised neu-button flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {shortcuts.map((sc, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-neu-btn neu-sunken text-sm"
            >
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {sc.description}
              </span>
              <kbd className="px-2.5 py-1 rounded neu-raised-sm text-xs font-bold text-[#6C63FF] border border-[#6C63FF]/30">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-5 text-center">
          <button
            onClick={() => setIsShortcutsModalOpen(false)}
            className="px-5 py-2 neu-accent-button rounded-neu-btn text-xs font-bold"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
