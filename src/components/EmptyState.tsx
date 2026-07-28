import React from 'react';
import { Plus, CheckSquare, Sparkles, FolderPlus } from 'lucide-react';

interface EmptyStateProps {
  type: 'no-lists' | 'no-tasks' | 'search-no-results';
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ type, onAction }) => {
  if (type === 'no-lists') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center neu-sunken rounded-neu-card my-6">
        <div className="w-16 h-16 rounded-full neu-raised flex items-center justify-center text-[#6C63FF] mb-4">
          <FolderPlus className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">No lists created yet</h3>
        <p className="text-sm font-light text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
          Organize your projects, work, and personal goals into custom neumorphic lists.
        </p>
        <button
          onClick={onAction}
          className="mt-5 neu-accent-button px-5 py-2.5 rounded-neu-btn text-xs font-bold flex items-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" /> Create Your First List
        </button>
      </div>
    );
  }

  if (type === 'search-no-results') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center neu-sunken rounded-neu-card my-6">
        <div className="w-16 h-16 rounded-full neu-raised flex items-center justify-center text-amber-500 mb-4">
          <Sparkles className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">No matching results</h3>
        <p className="text-sm font-light text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
          Try searching with another keyword or clear the search filter in the top navbar.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-10 text-center neu-sunken rounded-neu-card my-6">
      <div className="w-16 h-16 rounded-full neu-raised flex items-center justify-center text-[#6C63FF] mb-4">
        <CheckSquare className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-white">This list is empty</h3>
      <p className="text-sm font-light text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
        Stay focused and productive. Add your first task to get started!
      </p>
      <button
        onClick={onAction}
        className="mt-5 neu-accent-button px-5 py-2.5 rounded-neu-btn text-xs font-bold flex items-center gap-2"
      >
        <Plus className="w-4 h-4 stroke-[3]" /> Add Your First Task
      </button>
    </div>
  );
};
