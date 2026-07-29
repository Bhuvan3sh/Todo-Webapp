import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskItem } from './TaskItem';
import { Task } from '../types';
import { Sun, Plus, CheckCircle2, Clock, Calendar, Sparkles } from 'lucide-react';

export const TodayTasksSection: React.FC = () => {
  const { state, setEditingTask, setIsTaskModalOpen } = useApp();
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('all');

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const formattedDateStr = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Filter tasks for today or overdue
  const todayTasks = state.tasks.filter((t) => {
    if (!t.due_date) return false;
    const taskDate = new Date(t.due_date);
    const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
    
    const isTaskToday = taskDateStr === todayStr;
    const isOverdue = !t.is_completed && taskDate < new Date();

    return isTaskToday || isOverdue;
  });

  const completedCount = todayTasks.filter((t) => t.is_completed).length;
  const totalCount = todayTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredTodayTasks = todayTasks.filter((t) => {
    if (filter === 'pending') return !t.is_completed;
    if (filter === 'completed') return t.is_completed;
    return true;
  });

  const handleAddTaskForToday = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  return (
    <div className="mb-8 space-y-4">
      {/* Header Card */}
      <div className="neu-raised rounded-neu-card p-4 sm:p-6 relative transition-all border-l-4 border-amber-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
                <Sun className="w-5 h-5 text-amber-500 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
                  Tasks of the Day
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                    Today
                  </span>
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  {formattedDateStr}
                </p>
              </div>
            </div>
          </div>

          {/* Right Action & Filter Tabs */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center space-x-1 neu-sunken p-1 rounded-neu-btn">
              <button
                onClick={() => setFilter('all')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-neu-btn transition-all ${
                  filter === 'all' ? 'neu-raised text-[#6C63FF]' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All ({todayTasks.length})
              </button>

              <button
                onClick={() => setFilter('pending')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-neu-btn transition-all ${
                  filter === 'pending' ? 'neu-raised text-amber-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Pending ({todayTasks.length - completedCount})
              </button>

              <button
                onClick={() => setFilter('completed')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-neu-btn transition-all ${
                  filter === 'completed' ? 'neu-raised text-emerald-600' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Done ({completedCount})
              </button>
            </div>

            <button
              onClick={handleAddTaskForToday}
              className="neu-accent-button px-3.5 py-2 rounded-neu-btn text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Add Task for Today</span>
            </button>
          </div>

        </div>

        {/* Progress bar */}
        <div className="mt-4 pt-3 border-t border-gray-300/30">
          <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1.5">
            <span>Today's Progress</span>
            <span className="text-amber-600 font-bold">
              {completedCount}/{totalCount} ({progressPercent}%)
            </span>
          </div>

          <div className="w-full neu-progress-track h-2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Today's Tasks List */}
      {filteredTodayTasks.length === 0 ? (
        <div className="neu-sunken p-8 rounded-neu-card text-center text-gray-500">
          <Sun className="w-10 h-10 mx-auto mb-2 text-amber-400 opacity-60" />
          <h4 className="text-sm font-bold text-gray-700">No tasks for today</h4>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
            You're all clear! Click below to add a new task for today or pick from your lists.
          </p>
          <button
            onClick={handleAddTaskForToday}
            className="mt-4 neu-accent-button px-4 py-2 rounded-neu-btn text-xs font-bold inline-flex items-center gap-1.5 shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" /> Add Today's Task
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTodayTasks.map((task) => (
            <TaskItem key={task.id} task={task} showListBadge />
          ))}
        </div>
      )}
    </div>
  );
};
