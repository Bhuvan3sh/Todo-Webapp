import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { PriorityLevel } from '../types';
import { X, Save, CheckSquare, Flag, Calendar } from 'lucide-react';

export const TaskModal: React.FC = () => {
  const {
    state,
    isTaskModalOpen,
    setIsTaskModalOpen,
    editingTask,
    setEditingTask,
    createTask,
    updateTask,
  } = useApp();

  const [listId, setListId] = useState(state.activeListId || state.lists[0]?.id || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (editingTask) {
      setListId(editingTask.list_id);
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setPriority(editingTask.priority);
      setDueDate(
        editingTask.due_date
          ? new Date(editingTask.due_date).toISOString().split('T')[0]
          : ''
      );
    } else {
      setListId(state.activeListId || state.lists[0]?.id || '');
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
    }
    setError('');
  }, [editingTask, isTaskModalOpen, state.activeListId, state.lists]);

  if (!isTaskModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }
    if (!listId) {
      setError('Please select or create a list first');
      return;
    }

    if (editingTask) {
      await updateTask({
        ...editingTask,
        list_id: listId,
        title: title.trim(),
        description: description.trim() || null,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
    } else {
      await createTask({
        list_id: listId,
        title: title.trim(),
        description: description.trim() || null,
        is_completed: false,
        priority,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
      });
    }

    setIsTaskModalOpen(false);
    setEditingTask(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg neu-raised rounded-t-[24px] sm:rounded-neu-card p-5 sm:p-6 shadow-2xl transition-all max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-gray-300/30">
          <div className="flex items-center space-x-2">
            <CheckSquare className="w-5 h-5 text-[#6C63FF]" />
            <h3 className="text-base sm:text-lg font-bold text-gray-800">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h3>
          </div>
          <button
            onClick={() => {
              setIsTaskModalOpen(false);
              setEditingTask(null);
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

          {/* List Selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Assign to List <span className="text-rose-500">*</span>
            </label>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-neu-btn neu-sunken text-sm text-gray-800 font-medium"
            >
              {state.lists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Design wireframes for homepage"
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
              placeholder="Add extra context or steps required..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 rounded-neu-btn neu-sunken text-sm text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Flag className="w-3.5 h-3.5 text-[#6C63FF]" /> Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 rounded-neu-btn neu-sunken text-sm text-gray-800 font-medium"
              >
                <option value="low">🟢 Low Priority</option>
                <option value="medium">🟡 Medium Priority</option>
                <option value="high">🔴 High Priority</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-[#6C63FF]" /> Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-neu-btn neu-sunken text-sm text-gray-800"
              />
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-300/30">
            <button
              type="button"
              onClick={() => {
                setIsTaskModalOpen(false);
                setEditingTask(null);
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
              {editingTask ? 'Save Task' : 'Add Task'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
