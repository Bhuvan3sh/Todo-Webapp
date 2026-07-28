import React, { useState } from 'react';
import { Task } from '../types';
import { useApp } from '../context/AppContext';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  Check,
  Calendar,
  Edit2,
  Trash2,
  Save,
  X,
} from 'lucide-react';

interface TaskItemProps {
  task: Task;
}

export const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
  const { updateTask, deleteTask } = useApp();
  const [isEditingInline, setIsEditingInline] = useState(false);

  // Inline editing fields state
  const [inlineTitle, setInlineTitle] = useState(task.title);
  const [inlineDesc, setInlineDesc] = useState(task.description || '');
  const [inlinePriority, setInlinePriority] = useState(task.priority);
  const [inlineDueDate, setInlineDueDate] = useState(
    task.due_date ? new Date(task.due_date).toISOString().split('T')[0] : ''
  );

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : task.is_completed ? 0.65 : 1,
  };

  const handleToggleComplete = () => {
    updateTask({
      ...task,
      is_completed: !task.is_completed,
    });
  };

  const handleSaveInline = () => {
    if (!inlineTitle.trim()) return;
    updateTask({
      ...task,
      title: inlineTitle.trim(),
      description: inlineDesc.trim() || null,
      priority: inlinePriority,
      due_date: inlineDueDate ? new Date(inlineDueDate).toISOString() : null,
    });
    setIsEditingInline(false);
  };

  // Priority Left Border Stripe color
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return '#EF4444'; // Red
      case 'medium':
        return '#F59E0B'; // Amber
      case 'low':
      default:
        return '#10B981'; // Green
    }
  };

  const isOverdue =
    !task.is_completed &&
    task.due_date &&
    new Date(task.due_date) < new Date();

  return (
    <div
      ref={setNodeRef}
      className={`rounded-neu-card p-4 transition-all duration-200 border-l-4 relative group ${
        task.is_completed ? 'neu-pressed' : 'neu-raised hover:-translate-y-0.5'
      }`}
      style={{
        ...style,
        borderLeftColor: getPriorityColor(),
      }}
    >
      {/* Inline Editing Mode */}
      {isEditingInline ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6C63FF] uppercase tracking-wider">
              Editing Task
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={handleSaveInline}
                className="px-3 py-1 bg-[#6C63FF] text-white text-xs font-semibold rounded-neu-btn flex items-center gap-1 shadow-sm"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </button>
              <button
                onClick={() => setIsEditingInline(false)}
                className="px-2 py-1 neu-raised-sm text-gray-500 text-xs font-medium rounded-neu-btn"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <input
            type="text"
            value={inlineTitle}
            onChange={(e) => setInlineTitle(e.target.value)}
            placeholder="Task Title"
            className="w-full px-3 py-1.5 rounded-neu-btn neu-sunken text-sm text-gray-800 font-medium"
          />

          <textarea
            value={inlineDesc}
            onChange={(e) => setInlineDesc(e.target.value)}
            placeholder="Task description (optional)..."
            rows={2}
            className="w-full px-3 py-1.5 rounded-neu-btn neu-sunken text-xs text-gray-800"
          />

          <div className="flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <label className="text-gray-500 font-medium">Priority:</label>
              <select
                value={inlinePriority}
                onChange={(e) => setInlinePriority(e.target.value as any)}
                className="px-2 py-1 rounded-neu-btn neu-sunken text-xs font-semibold"
              >
                <option value="low">Low (Green)</option>
                <option value="medium">Medium (Amber)</option>
                <option value="high">High (Red)</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-gray-500 font-medium">Due Date:</label>
              <input
                type="date"
                value={inlineDueDate}
                onChange={(e) => setInlineDueDate(e.target.value)}
                className="px-2 py-1 rounded-neu-btn neu-sunken text-xs"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Normal Display Mode - Clean Multi-row Layout */
        <div className="space-y-2.5">
          
          {/* Top Row: Drag Handle, Checkbox, Title (left) & Actions (right) */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              
              {/* Drag Handle */}
              <button
                {...attributes}
                {...listeners}
                className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing p-1 flex-shrink-0"
                title="Drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </button>

              {/* Neumorphic Custom Checkbox */}
              <button
                onClick={handleToggleComplete}
                className={`w-5 h-5 sm:w-6 sm:h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-all ${
                  task.is_completed
                    ? 'task-checkbox-checked'
                    : 'neu-sunken text-transparent hover:text-gray-300'
                }`}
                title={task.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
              >
                <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[3]" />
              </button>

              {/* Task Title */}
              <span
                onClick={handleToggleComplete}
                className={`text-sm sm:text-base font-semibold cursor-pointer truncate ${
                  task.is_completed
                    ? 'line-through text-gray-400'
                    : 'text-gray-800'
                }`}
              >
                {task.title}
              </span>
            </div>

            {/* Actions (Edit & Delete) */}
            <div className="flex items-center space-x-1 flex-shrink-0">
              <button
                onClick={() => setIsEditingInline(true)}
                className="p-1.5 text-gray-400 hover:text-[#6C63FF] transition-colors"
                title="Edit Task"
              >
                <Edit2 className="w-4 h-4" />
              </button>

              <button
                onClick={() => deleteTask(task.id)}
                className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Task Description (Full Width & Indented) */}
          {task.description && (
            <div className="pl-9 text-xs sm:text-sm text-gray-600 font-normal leading-relaxed">
              {task.description}
            </div>
          )}

          {/* Bottom Row: Priority & Due Date Badges */}
          <div className="pl-9 pt-0.5 flex flex-wrap items-center gap-2">
            <span
              className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full ${
                task.priority === 'high'
                  ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  : task.priority === 'medium'
                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
              }`}
            >
              {task.priority}
            </span>

            {task.due_date && (
              <span
                className={`text-[11px] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium ${
                  isOverdue
                    ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold'
                    : 'text-gray-600 bg-gray-200/60 border border-gray-300/40'
                }`}
              >
                <Calendar className="w-3 h-3" />
                {new Date(task.due_date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>

        </div>
      )}
    </div>
  );
};
