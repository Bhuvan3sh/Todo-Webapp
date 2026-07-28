import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { X, Save, FolderPlus, Palette } from 'lucide-react';

const PRESET_COLORS = [
  '#6C63FF', // Neuro Purple
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#EC4899', // Pink
  '#3B82F6', // Blue
];

export const ListModal: React.FC = () => {
  const {
    isListModalOpen,
    setIsListModalOpen,
    editingList,
    setEditingList,
    createList,
    updateList,
  } = useApp();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('#6C63FF');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingList) {
      setTitle(editingList.title);
      setDescription(editingList.description || '');
      setDeadline(
        editingList.deadline
          ? new Date(editingList.deadline).toISOString().split('T')[0]
          : ''
      );
      setColor(editingList.color || '#6C63FF');
    } else {
      setTitle('');
      setDescription('');
      setDeadline('');
      setColor('#6C63FF');
    }
    setError('');
  }, [editingList, isListModalOpen]);

  if (!isListModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('List title is required');
      return;
    }

    if (editingList) {
      await updateList({
        ...editingList,
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        color,
      });
    } else {
      await createList({
        title: title.trim(),
        description: description.trim() || null,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        color,
      });
    }

    setIsListModalOpen(false);
    setEditingList(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg neu-raised rounded-t-[24px] sm:rounded-neu-card p-5 sm:p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-300/30">
          <div className="flex items-center space-x-2">
            <FolderPlus className="w-5 h-5 text-[#6C63FF]" />
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              {editingList ? 'Edit List' : 'Create New List'}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsListModalOpen(false);
              setEditingList(null);
            }}
            className="w-8 h-8 rounded-full neu-raised neu-button flex items-center justify-center text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-5 space-y-4">
          {error && (
            <div className="p-3 rounded-neu-btn bg-rose-500/10 text-rose-500 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              List Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. 🎯 Project Sprint"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-4 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Description (optional)
            </label>
            <textarea
              placeholder="Brief goals or summary of tasks..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-neu-btn neu-sunken text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 rounded-neu-btn neu-sunken text-sm text-gray-800"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Palette className="w-3.5 h-3.5 text-[#6C63FF]" /> Color Accent
              </label>
              <div className="flex items-center space-x-2.5 pt-1">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full transition-transform ${
                      color === c ? 'scale-125 ring-2 ring-[#6C63FF] ring-offset-2' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-300/30">
            <button
              type="button"
              onClick={() => {
                setIsListModalOpen(false);
                setEditingList(null);
              }}
              className="px-4 py-2 rounded-neu-btn neu-raised neu-button text-xs font-semibold text-gray-600"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="neu-accent-button px-5 py-2.5 rounded-neu-btn text-xs font-bold flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              {editingList ? 'Save Changes' : 'Create List'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
