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
  ListTodo,
  Layers,
  Sparkles,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const {
    state,
    dispatch,
    setIsListModalOpen,
    setEditingList,
    setIsTaskModalOpen,
    setEditingTask,
    deleteList,
    reorderTasks,
    showToast,
  } = useApp();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const { activeListId, lists, tasks, searchQuery, isLoadingData } = state;
  const activeList = lists.find((l) => l.id === activeListId);

  // Filter tasks for active list
  const activeListTasks = tasks.filter((t) => t.list_id === activeListId);

  // Search filter across tasks
  const filteredTasks = activeListTasks.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      (t.description && t.description.toLowerCase().includes(q))
    );
  });

  const completedCount = activeListTasks.filter((t) => t.is_completed).length;
  const totalCount = activeListTasks.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // DND Kit Sensors optimized for both Desktop Pointer and Phone Touch
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms touch delay prevents scroll conflicts on mobile phones
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
      const oldIndex = activeListTasks.findIndex((t) => t.id === active.id);
      const newIndex = activeListTasks.findIndex((t) => t.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(activeListTasks, oldIndex, newIndex);
        const otherTasks = tasks.filter((t) => t.list_id !== activeListId);
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
    if (!activeList) return;
    exportListToPdf(activeList, activeListTasks);
    showToast(`PDF for "${activeList.title}" downloaded`, 'success');
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] dark:bg-[#121212] transition-colors duration-300 flex flex-col pb-20 md:pb-0">
      
      {/* Top Navbar with mobile sidebar toggle */}
      <Navbar
        onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row">
        
        {/* Responsive Sidebar (Desktop Panel & Mobile Drawer) */}
        <Sidebar
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-3.5 sm:p-6 md:p-8 max-w-full overflow-x-hidden">
          
          {/* Dashboard Stat Overview Cards */}
          <DashboardOverview />

          {/* Active List View */}
          {isLoadingData ? (
            <div className="space-y-4">
              <div className="h-24 rounded-neu-card neu-skeleton neu-raised" />
              <div className="h-16 rounded-neu-card neu-skeleton neu-raised" />
              <div className="h-16 rounded-neu-card neu-skeleton neu-raised" />
            </div>
          ) : !activeList ? (
            <EmptyState
              type="no-lists"
              onAction={() => {
                setEditingList(null);
                setIsListModalOpen(true);
              }}
            />
          ) : (
            <div className="space-y-5">
              
              {/* Active List Header Card */}
              <div className="neu-raised rounded-neu-card p-4 sm:p-6 relative transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-sm flex-shrink-0"
                        style={{ backgroundColor: activeList.color || '#6C63FF' }}
                      />
                      <h2 className="text-lg sm:text-2xl font-bold text-gray-800 dark:text-white truncate">
                        {activeList.title}
                      </h2>
                    </div>

                    {activeList.description && (
                      <p className="text-xs sm:text-sm font-light text-gray-600 dark:text-gray-300 mt-1 pl-6 sm:pl-7">
                        {activeList.description}
                      </p>
                    )}

                    {activeList.deadline && (
                      <div className="flex items-center space-x-2 text-xs text-amber-600 dark:text-amber-400 mt-1.5 pl-6 sm:pl-7 font-medium">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Deadline: {new Date(activeList.deadline).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>

                  {/* Action Buttons Header */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 sm:pt-0 border-t sm:border-0 border-gray-300/30 dark:border-gray-800/50">
                    
                    {/* PDF Export */}
                    <button
                      onClick={handlePdfExport}
                      className="neu-raised neu-button px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-neu-btn text-xs font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 hover:text-[#6C63FF]"
                      title="Download Printable PDF"
                    >
                      <Download className="w-4 h-4 text-[#6C63FF]" />
                      <span>Export PDF</span>
                    </button>

                    {/* Edit List */}
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

                    {/* Delete List */}
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

                    {/* Add Task CTA (Desktop) */}
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

                {/* Progress bar and task completion summary */}
                <div className="mt-4 pt-3.5 border-t border-gray-300/30 dark:border-gray-800/50">
                  <div className="flex items-center justify-between text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>Task Progress</span>
                    <span>
                      {completedCount}/{totalCount} ({progressPercent}%)
                    </span>
                  </div>

                  <div className="w-full neu-progress-track h-2">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${progressPercent}%`,
                        backgroundColor: activeList.color || '#6C63FF',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Tasks List Container with Touch DND support */}
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
                        <TaskItem key={task.id} task={task} />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}

            </div>
          )}

        </main>
      </div>

      {/* Floating Action Button (FAB) for Quick Task Creation on Mobile Phones */}
      <button
        onClick={() => {
          setEditingTask(null);
          setIsTaskModalOpen(true);
        }}
        className="md:hidden fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full neu-accent-button flex items-center justify-center shadow-2xl active:scale-90 transition-transform"
        title="Add New Task"
      >
        <Plus className="w-7 h-7 stroke-[3]" />
      </button>

      {/* Mobile Bottom Quick Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#E0E5EC] dark:bg-[#121212] border-t border-gray-300/40 dark:border-gray-800/60 py-2 px-6 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setIsMobileSidebarOpen(true)}
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-[#6C63FF] focus:text-[#6C63FF]"
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Lists</span>
        </button>

        <button
          onClick={() => {
            setEditingList(null);
            setIsListModalOpen(true);
          }}
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-[#6C63FF] focus:text-[#6C63FF]"
        >
          <Plus className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">New List</span>
        </button>

        <button
          onClick={handlePdfExport}
          className="flex flex-col items-center text-gray-600 dark:text-gray-300 hover:text-[#6C63FF] focus:text-[#6C63FF]"
        >
          <Download className="w-5 h-5 text-[#6C63FF]" />
          <span className="text-[10px] font-bold mt-0.5">PDF</span>
        </button>
      </div>

      {/* Modals & Toast Container */}
      <ListModal />
      <TaskModal />
      <KeyboardShortcutsModal />
      <ToastContainer />
    </div>
  );
};
