import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Navbar } from '../components/Navbar';
import { Sidebar } from '../components/Sidebar';
import { DashboardOverview } from '../components/DashboardOverview';
import { TaskItem } from '../components/TaskItem';
import { ListModal } from '../components/ListModal';
import { TaskModal } from '../components/TaskModal';
import { KeyboardShortcutsModal } from '../components/KeyboardShortcutsModal';
import { ToastContainer } from '../components/ToastContainer';
import { EmptyState } from '../components/EmptyState';
import { NotificationPromptBanner } from '../components/NotificationPromptBanner';
import { InstallPromptModal } from '../components/InstallPrompt';
import { McpDocsModal } from '../components/McpDocsModal';
import { TodayTasksSection } from '../components/TodayTasksSection';
import { exportListToPdf } from '../lib/pdfExport';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';

import {
  Plus,
  Download,
  Calendar,
  Edit2,
  Trash2,
  Layers,
  Sun,
  Bot,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    state,
    dispatch,
    setIsListModalOpen,
    setEditingList,
    setIsTaskModalOpen,
    setEditingTask,
    setIsMcpDocsOpen,
    deleteList,
    reorderTasks,
    showToast,
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { activeListId, activeView, lists, tasks, searchQuery, isLoadingData } = state;
  const activeList = lists.find((l) => l.id === activeListId);

  // Filter tasks based on activeView or activeListId
  const currentViewTasks = React.useMemo(() => {
    if (activeView === 'today') {
      const today = new Date();
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      return tasks.filter((t) => {
        if (!t.due_date) return false;
        const taskDate = new Date(t.due_date);
        const taskDateStr = `${taskDate.getFullYear()}-${String(taskDate.getMonth() + 1).padStart(2, '0')}-${String(taskDate.getDate()).padStart(2, '0')}`;
        return taskDateStr === todayStr || (!t.is_completed && taskDate < new Date());
      });
    } else if (activeView === 'upcoming') {
      const now = new Date();
      return tasks.filter((t) => {
        if (!t.due_date || t.is_completed) return false;
        return new Date(t.due_date) > now;
      });
    } else if (activeView === 'all') {
      return tasks;
    } else {
      return tasks.filter((t) => t.list_id === activeListId);
    }
  }, [activeView, activeListId, tasks]);

  // Search filter across tasks
  const filteredTasks = currentViewTasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  const completedCount = currentViewTasks.filter((t) => t.is_completed).length;
  const totalCount = currentViewTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // DND Kit Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = currentViewTasks.findIndex((t) => t.id === active.id);
      const newIndex = currentViewTasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(currentViewTasks, oldIndex, newIndex);
        const otherTasks = tasks.filter((t) => !currentViewTasks.some((ct) => ct.id === t.id));
        reorderTasks([...otherTasks, ...reordered]);
      }
    }
  };

  // Keyboard Hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes((document.activeElement as HTMLElement)?.tagName);
      if (isInput) return;

      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setEditingTask(null);
        setIsTaskModalOpen(true);
      } else if (e.key === 'l' || e.key === 'L') {
        e.preventDefault();
        setEditingList(null);
        setIsListModalOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setEditingTask, setIsTaskModalOpen, setEditingList, setIsListModalOpen]);

  const handlePdfExport = () => {
    if (!activeList && activeView === 'list') return;
    const targetList = activeList || {
      id: 'export-view',
      user_id: '',
      title: activeView === 'today' ? "Today's Tasks" : activeView === 'upcoming' ? 'Upcoming Tasks' : 'All Tasks',
      color: '#6C63FF',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    exportListToPdf(targetList, currentViewTasks);
    showToast(`PDF for "${targetList.title}" downloaded`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] transition-colors duration-300 flex flex-col pb-20 md:pb-0">
      
      {/* Top Navbar */}
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        
        {/* Responsive Sidebar */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-full overflow-x-hidden">
          
          {/* Notification Permission Banner */}
          <NotificationPromptBanner />

          {/* Dashboard Stat Overview Cards */}
          <DashboardOverview />

          {/* Today's Tasks Section (Always rendered on Home Page in today view or top of dashboard) */}
          {activeView === 'today' && <TodayTasksSection />}

          {/* View Content (Upcoming, All, or Specific List) */}
          {isLoadingData ? (
            <div className="space-y-4">
              <div className="h-24 rounded-neu-card neu-skeleton neu-raised" />
              <div className="h-16 rounded-neu-card neu-skeleton neu-raised" />
              <div className="h-16 rounded-neu-card neu-skeleton neu-raised" />
            </div>
          ) : activeView === 'list' && !activeList ? (
            <EmptyState
              type="no-lists"
              onAction={() => {
                setEditingList(null);
                setIsListModalOpen(true);
              }}
            />
          ) : (
            activeView !== 'today' && (
              <div className="space-y-5">
                
                {/* Active View / List Header Card */}
                <div className="neu-raised rounded-neu-card p-4 sm:p-6 relative transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0"
                          style={{ backgroundColor: activeList?.color || '#6C63FF' }}
                        />
                        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">
                          {activeView === 'upcoming'
                            ? 'Upcoming Tasks'
                            : activeView === 'all'
                            ? 'All Tasks'
                            : activeList?.title}
                        </h2>
                      </div>

                      {activeList?.description && activeView === 'list' && (
                        <p className="text-xs sm:text-sm font-light text-gray-600 mt-1 pl-6 sm:pl-7">
                          {activeList.description}
                        </p>
                      )}
                    </div>

                    {/* Action Buttons Header */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-gray-300/30">
                      
                      {/* PDF Export */}
                      <button
                        onClick={handlePdfExport}
                        className="neu-raised neu-button px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-neu-btn text-xs font-semibold text-gray-700 flex items-center gap-1.5 hover:text-[#6C63FF]"
                        title="Download Printable PDF"
                      >
                        <Download className="w-4 h-4 text-[#6C63FF]" />
                        <span>Export PDF</span>
                      </button>

                      {/* Edit List (Only in List view) */}
                      {activeView === 'list' && activeList && (
                        <>
                          <button
                            onClick={() => {
                              setEditingList(activeList);
                              setIsListModalOpen(true);
                            }}
                            className="neu-raised neu-button p-2 rounded-neu-btn text-gray-500 hover:text-[#6C63FF]"
                            title="Edit List"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              if (confirm(`Delete "${activeList.title}" list?`)) {
                                deleteList(activeList.id);
                              }
                            }}
                            className="neu-raised neu-button p-2 rounded-neu-btn text-gray-500 hover:text-rose-500"
                            title="Delete List"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Add Task CTA */}
                      <button
                        onClick={() => {
                          setEditingTask(null);
                          setIsTaskModalOpen(true);
                        }}
                        className="hidden sm:flex neu-accent-button px-4 py-2 rounded-neu-btn text-xs font-bold items-center gap-1.5 shadow-md"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" /> Add Task
                      </button>

                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 pt-3.5 border-t border-gray-300/30">
                    <div className="flex items-center justify-between text-xs font-semibold text-gray-500 mb-1.5">
                      <span>Progress</span>
                      <span>
                        {completedCount}/{totalCount} ({progressPercent}%)
                      </span>
                    </div>

                    <div className="w-full neu-progress-track h-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${progressPercent}%`,
                          backgroundColor: activeList?.color || '#6C63FF',
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Tasks List Container */}
                {filteredTasks.length === 0 ? (
                  searchQuery ? (
                    <EmptyState type="search-no-results" />
                  ) : (
                    <EmptyState
                      type="no-tasks"
                      onAction={() => {
                        setEditingTask(null);
                        setIsTaskModalOpen(true);
                      }}
                    />
                  )
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={filteredTasks.map((t) => t.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="space-y-3">
                        {filteredTasks.map((task) => (
                          <TaskItem key={task.id} task={task} showListBadge={activeView !== 'list'} />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}

              </div>
            )
          )}

        </main>
      </div>

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        className="md:hidden fixed bottom-16 right-4 z-40 w-12 h-12 rounded-full neu-accent-button flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        title="Add New Task"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Mobile Bottom Quick Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#E0E5EC] border-t border-gray-300/40 py-2 px-3 flex items-center justify-around shadow-lg">
        <button
          onClick={() => {
            dispatch({ type: 'SET_ACTIVE_VIEW', payload: 'today' });
          }}
          className={`flex flex-col items-center ${activeView === 'today' ? 'text-amber-600' : 'text-gray-600'}`}
        >
          <Sun className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Today</span>
        </button>

        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center text-gray-600 hover:text-[#6C63FF] focus:text-[#6C63FF]"
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">Lists</span>
        </button>

        <button
          onClick={() => {
            setEditingList(null);
            setIsListModalOpen(true);
          }}
          className="flex flex-col items-center text-gray-600 hover:text-[#6C63FF] focus:text-[#6C63FF]"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-bold mt-0.5">New List</span>
        </button>

        <button
          onClick={() => setIsMcpDocsOpen(true)}
          className="flex flex-col items-center text-gray-600 hover:text-[#6C63FF] focus:text-[#6C63FF]"
        >
          <Bot className="w-4 h-4 text-[#6C63FF]" />
          <span className="text-[10px] font-bold mt-0.5">AI Docs</span>
        </button>

        <button
          onClick={handlePdfExport}
          className="flex flex-col items-center text-gray-600 hover:text-[#6C63FF] focus:text-[#6C63FF]"
        >
          <Download className="w-4 h-4 text-gray-600" />
          <span className="text-[10px] font-bold mt-0.5">PDF</span>
        </button>
      </div>

      {/* Modals & Toast Container */}
      <ListModal />
      <TaskModal />
      <KeyboardShortcutsModal />
      <InstallPromptModal />
      <McpDocsModal />
      <ToastContainer />
    </div>
  );
};

