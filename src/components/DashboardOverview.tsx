import React from 'react';
import { useApp } from '../context/AppContext';
import { Folder, CheckCircle2, AlertTriangle, ListTodo } from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const { state } = useApp();

  const totalLists = state.lists.length;
  const totalTasks = state.tasks.length;

  // Completed Today
  const todayStr = new Date().toISOString().split('T')[0];
  const completedToday = state.tasks.filter((task) => {
    if (!task.is_completed) return false;
    const taskUpdatedDate = new Date(task.updated_at).toISOString().split('T')[0];
    return taskUpdatedDate === todayStr;
  }).length;

  // Overdue tasks
  const now = new Date();
  const overdueTasks = state.tasks.filter((task) => {
    if (task.is_completed || !task.due_date) return false;
    return new Date(task.due_date) < now;
  }).length;

  const stats = [
    {
      title: 'Total Lists',
      value: totalLists,
      icon: Folder,
      color: 'text-[#6C63FF]',
    },
    {
      title: 'Total Tasks',
      value: totalTasks,
      icon: ListTodo,
      color: 'text-indigo-500',
    },
    {
      title: 'Completed Today',
      value: completedToday,
      icon: CheckCircle2,
      color: 'text-emerald-500',
    },
    {
      title: 'Overdue Tasks',
      value: overdueTasks,
      icon: AlertTriangle,
      color: 'text-rose-500',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="neu-raised rounded-neu-card p-4 sm:p-5 flex items-center justify-between transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div>
              <p className="text-[11px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {stat.title}
              </p>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                {stat.value}
              </h3>
            </div>
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full neu-raised flex items-center justify-center ${stat.color}`}>
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
          </div>
        );
      })}
    </div>
  );
};
