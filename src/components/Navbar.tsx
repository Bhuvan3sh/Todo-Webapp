import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  LogOut,
  Command,
  CheckSquare,
  Menu,
  X,
  Plus,
} from 'lucide-react';

interface NavbarProps {
  onToggleMobileSidebar?: () => void;
  isMobileSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  isMobileSidebarOpen,
}) => {
  const { state, dispatch, setIsShortcutsModalOpen, setIsTaskModalOpen, setEditingTask } = useApp();
  const { user, signOut, isDemoMode } = useAuth();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Focus search input on '/' shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        const isInput = ['INPUT', 'TEXTAREA'].includes((document.activeElement as HTMLElement)?.tagName);
        if (!isInput) {
          e.preventDefault();
          setIsMobileSearchOpen(true);
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-[#E0E5EC] py-3 px-4 sm:px-6 md:px-8 border-b border-gray-300/30 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Mobile Menu Toggle & Brand */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden w-10 h-10 rounded-full neu-raised neu-button flex items-center justify-center text-gray-700"
            title="Toggle Lists Menu"
          >
            {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full neu-raised flex items-center justify-center text-[#6C63FF]">
              <CheckSquare className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-gray-800 flex items-center gap-1.5">
                Task Buddy
                {isDemoMode && (
                  <span className="hidden xs:inline-block text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#6C63FF]/20 text-[#6C63FF]">
                    Demo
                  </span>
                )}
              </h1>
            </div>
          </div>
        </div>

        {/* Desktop Global Search Input */}
        <div className="hidden md:flex flex-1 max-w-md relative mx-2">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks & lists... (Press '/')"
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
              className="w-full pl-10 pr-12 py-2 rounded-neu-btn text-sm neu-sunken text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50 transition-all"
            />
            <span className="absolute right-3 text-[11px] font-medium text-gray-400 border border-gray-400/40 rounded px-1.5 py-0.5">
              /
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          
          {/* Mobile Search Icon Toggle */}
          <button
            onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
            className="md:hidden w-9 h-9 rounded-full neu-raised neu-button flex items-center justify-center text-gray-600"
            title="Search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Shortcuts Trigger */}
          <button
            onClick={() => setIsShortcutsModalOpen(true)}
            title="Keyboard Shortcuts"
            className="hidden sm:flex w-9 h-9 sm:w-10 sm:h-10 rounded-full neu-raised neu-button items-center justify-center text-gray-600 hover:text-[#6C63FF]"
          >
            <Command className="w-4 h-4" />
          </button>

          {/* Quick Add Task Button */}
          <button
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="neu-accent-button w-9 h-9 sm:w-auto sm:px-3 sm:py-2 rounded-full sm:rounded-neu-btn font-bold text-xs flex items-center justify-center gap-1 shadow-sm"
            title="Add Task"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="hidden sm:inline">Add Task</span>
          </button>

          {/* User Email & Logout */}
          {user && (
            <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-gray-300/40">
              <button
                onClick={signOut}
                title="Log Out"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full neu-raised neu-button flex items-center justify-center text-rose-500 hover:text-rose-600"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>

      {/* Mobile Search Bar Expansion */}
      {isMobileSearchOpen && (
        <div className="mt-3 md:hidden px-1 pb-1 animate-fade-in">
          <div className="relative flex items-center w-full">
            <Search className="absolute left-3.5 w-4 h-4 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search tasks & lists..."
              value={state.searchQuery}
              onChange={(e) => dispatch({ type: 'SET_SEARCH_QUERY', payload: e.target.value })}
              className="w-full pl-10 pr-9 py-2 rounded-neu-btn text-sm neu-sunken text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-[#6C63FF]/50"
            />
            {state.searchQuery && (
              <button
                onClick={() => dispatch({ type: 'SET_SEARCH_QUERY', payload: '' })}
                className="absolute right-3 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
