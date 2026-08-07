import React from 'react';
import { useApp } from '../context/AppContext';
import { Plus, ListTodo, Calendar, Clock, Edit2, Trash2, X, FolderPlus, Sun, Bot, Download } from 'lucide-react';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onCloseMobile }) => {
  const {
    state,
    dispatch,
    setIsListModalOpen,
    setEditingList,
    deleteList,
    setIsMcpDocsOpen,
    setIsInstallModalOpen,
  } = useApp();

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
  const todayTasksCount = state.tasks.filter((t) => {
    if (t.is_completed || !t.due_date) return false;
    const d = new Date(t.due_date);
    const taskDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return taskDateStr === todayStr || d < new Date();
  }).length;

  const getListStats = (listId: string) => {
    const listTasks = state.tasks.filter((t) => t.list_id === listId);
    const completedTasks = listTasks.filter((t) => t.is_completed).length;
    const total = listTasks.length;
    const percentage = total > 0 ? Math.round((completedTasks / total) * 100) : 0;
    return { completedTasks, total, percentage };
  };

  const getDeadlineBadge = (deadlineStr?: string | null) => {
    if (!deadlineStr) return null;
    const now = new Date();
    const deadline = new Date(deadlineStr);
    const diffTime = deadline.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return (
        <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Overdue
        </span>
      );
    } else if (diffDays === 0) {
      return (
        <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center gap-1">
          <Clock className="w-3 h-3" /> Today
        </span>
      );
    } else {
      return (
        <span className="text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 flex items-center gap-1">
          <Calendar className="w-3 h-3" /> {diffDays}d left
        </span>
      );
    }
  };

  const content = (
    <div className="flex flex-col h-full">
      
      {/* Smart Views & Tools Navigation */}
      <div className="mb-5 space-y-1.5 pb-4 border-b border-gray-300/30">
        <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
          Views & Tools
        </h2>

        {/* Today's Tasks (Home Page) */}
        <button
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'today' });
            onCloseMobile?.();
          }}
          className={`w-full p-2.5 rounded-neu-card flex items-center justify-between text-xs font-bold transition-all ${
            state.activeView === 'today'
              ? 'neu-pressed text-amber-600 border-l-4 border-amber-500'
              : 'neu-raised text-gray-700 hover:text-amber-600'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Sun className="w-4 h-4 text-amber-500" />
            <span>Today's Tasks (Home)</span>
          </div>
          {todayTasksCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/15 text-amber-700 font-extrabold">
              {todayTasksCount}
            </span>
          )}
        </button>

        {/* Upcoming Tasks */}
        <button
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'upcoming' });
            onCloseMobile?.();
          }}
          className={`w-full p-2.5 rounded-neu-card flex items-center justify-between text-xs font-bold transition-all ${
            state.activeView === 'upcoming'
              ? 'neu-pressed text-[#6C63FF] border-l-4 border-[#6C63FF]'
              : 'neu-raised text-gray-700 hover:text-[#6C63FF]'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            <Calendar className="w-4 h-4 text-[#6C63FF]" />
            <span>Upcoming Tasks</span>
          </div>
        </button>

        {/* Install App Shortcut */}
        <button
          onClick={() => {
            setIsInstallModalOpen(true);
            onCloseMobile?.();
          }}
          className="w-full p-2.5 rounded-neu-card flex items-center space-x-2.5 text-xs font-bold text-emerald-600 neu-raised hover:bg-emerald-500/5 transition-all mt-1"
        >
          <Download className="w-4 h-4 text-emerald-500" />
          <span>Install App (iOS / Android)</span>
        </button>

        {/* Connect AI / MCP Integration Docs */}
        <button
          onClick={() => {
            setIsMcpDocsOpen(true);
            onCloseMobile?.();
          }}
          className="w-full p-2.5 rounded-neu-card flex items-center space-x-2.5 text-xs font-bold text-[#6C63FF] neu-raised hover:bg-[#6C63FF]/5 transition-all"
        >
          <Bot className="w-4 h-4 text-[#6C63FF]" />
          <span>Connect AI</span>
        </button>
      </div>

      {/* Sidebar Header */}
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-300/30">
        <h2 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-2">
          <ListTodo className="w-4 h-4 text-[#6C63FF]" />
          Your Lists ({state.lists.length})
        </h2>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setEditingList(null);
              setIsListModalOpen(true);
              onCloseMobile?.();
            }}
            className="neu-accent-button px-3 py-1.5 rounded-neu-btn text-xs font-semibold flex items-center gap-1.5"
            title="Create New List"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New List
          </button>

          {/* Close drawer button on mobile */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden w-8 h-8 rounded-full neu-raised flex items-center justify-center text-gray-500"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lists Scroll Area */}
      <div className="space-y-3.5 flex-1 overflow-y-auto pr-1">
        {state.lists.length === 0 ? (
          <div className="p-6 text-center neu-sunken rounded-neu-card text-gray-500">
            <FolderPlus className="w-8 h-8 mx-auto mb-2 opacity-50 text-[#6C63FF]" />
            <p className="text-sm font-medium">No lists created</p>
            <button
              onClick={() => {
                setEditingList(null);
                setIsListModalOpen(true);
                onCloseMobile?.();
              }}
              className="mt-3 text-xs font-bold text-[#6C63FF] underline"
            >
              + Add a new list
            </button>
          </div>
        ) : (
          state.lists.map((list) => {
            const isActive = state.activeListId === list.id;
            const { completedTasks, total, percentage } = getListStats(list.id);
            const deadlineBadge = getDeadlineBadge(list.deadline);

            return (
              <div
                key={list.id}
                onClick={() => {
                  dispatch({ type: 'SET_ACTIVE_LIST', payload: list.id });
                  onCloseMobile?.();
                }}
                className={`p-3.5 sm:p-4 rounded-neu-card cursor-pointer transition-all relative group ${
                  isActive ? 'neu-pressed border-l-4' : 'neu-raised hover:-translate-y-0.5 active:scale-[0.98]'
                }`}
                style={{
                  borderLeftColor: isActive ? list.color || '#6C63FF' : 'transparent',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2.5 truncate">
                    <span
                      className="w-3.5 h-3.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: list.color || '#6C63FF' }}
                    />
                    <h3 className="font-semibold text-sm text-gray-800 truncate">
                      {list.title}
                    </h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingList(list);
                        setIsListModalOpen(true);
                        onCloseMobile?.();
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:text-[#6C63FF] active:scale-95"
                      title="Edit List"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete list "${list.title}" and all tasks?`)) {
                          deleteList(list.id);
                        }
                      }}
                      className="p-1.5 rounded-full text-gray-400 hover:text-rose-500 active:scale-95"
                      title="Delete List"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {list.description && (
                  <p className="text-xs text-gray-500 line-clamp-1 mb-2 font-light">
                    {list.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs my-2">
                  <div>{deadlineBadge}</div>
                  <span className="font-medium text-gray-500 text-[11px] bg-gray-200/50 px-2 py-0.5 rounded-full">
                    {completedTasks}/{total} tasks
                  </span>
                </div>

                <div className="w-full neu-progress-track h-1.5 mt-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: list.color || '#6C63FF',
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar Layout */}
      <aside className="hidden md:block w-72 lg:w-80 flex-shrink-0 p-6 md:min-h-[calc(100vh-73px)] border-r border-gray-300/30">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Drawer content panel */}
          <div className="relative w-4/5 max-w-xs bg-[#E0E5EC] h-full p-5 shadow-2xl flex flex-col z-10 animate-slide-right">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
