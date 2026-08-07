import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { List, Task } from '../types';
import { FolderPlus, CheckCircle, ArrowRight, Bot } from 'lucide-react';

export const SharePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const listId = searchParams.get('listId');
  const sharedTitle = searchParams.get('title') || 'Shared List';

  const { user } = useAuth();
  const { createList, createTask, showToast } = useApp();
  const navigate = useNavigate();

  const [sharedList, setSharedList] = useState<List | null>(null);
  const [sharedTasks, setSharedTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [addedSuccess, setAddedSuccess] = useState(false);

  useEffect(() => {
    if (!listId) {
      setLoading(false);
      return;
    }

    const fetchSharedData = async () => {
      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: listData } = await supabase
            .from('lists')
            .select('*')
            .eq('id', listId)
            .single();

          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('list_id', listId);

          if (listData) setSharedList(listData);
          if (tasksData) setSharedTasks(tasksData);
        } catch (e) {
          console.warn('Error fetching shared list:', e);
        }
      }
      setLoading(false);
    };

    fetchSharedData();
  }, [listId]);

  const handleAddListToAccount = async () => {
    if (!user) {
      showToast('Please sign in to add this list to your account.', 'info');
      navigate('/login');
      return;
    }

    setIsAdding(true);
    try {
      const now = new Date().toISOString();
      const newListTitle = sharedList?.title || sharedTitle;
      
      await createList({
        title: `${newListTitle} (Shared)`,
        description: sharedList?.description || 'Shared via Task Buddy',
        color: sharedList?.color || '#6C63FF',
        deadline: sharedList?.deadline || null,
      });

      // Add tasks to newly created list
      for (const t of sharedTasks) {
        await createTask({
          list_id: sharedList?.id || '',
          title: t.title,
          description: t.description || null,
          priority: t.priority || 'medium',
          due_date: t.due_date || null,
          is_completed: false,
        });
      }

      setAddedSuccess(true);
      showToast(`Added list "${newListTitle}" to your account!`, 'success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (e) {
      showToast('Failed to add list.', 'error');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#E0E5EC] flex items-center justify-center p-4">
      <div className="w-full max-w-md neu-raised rounded-neu-card p-6 sm:p-8 space-y-6 text-gray-800">
        
        {/* Header Branding */}
        <div className="flex items-center space-x-3 pb-4 border-b border-gray-300/40">
          <div className="w-10 h-10 rounded-full neu-raised flex items-center justify-center text-[#6C63FF]">
            <Bot className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-xl text-gray-800">Task Buddy</h1>
            <p className="text-xs text-gray-500 font-medium">Shared List Import</p>
          </div>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading shared list...</div>
        ) : (
          <>
            {/* List Info Card */}
            <div className="neu-sunken p-5 rounded-neu-card space-y-3">
              <div className="flex items-center space-x-3">
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: sharedList?.color || '#6C63FF' }}
                />
                <h2 className="font-bold text-lg text-gray-800">
                  {sharedList?.title || sharedTitle}
                </h2>
              </div>

              {sharedList?.description && (
                <p className="text-xs text-gray-600 font-light">{sharedList.description}</p>
              )}

              <div className="text-xs text-gray-500 font-semibold pt-1">
                📋 Contains {sharedTasks.length} task{sharedTasks.length === 1 ? '' : 's'}
              </div>
            </div>

            {/* Confirmation Box */}
            <div className="text-center space-y-3">
              <p className="text-xs text-gray-600">
                Would you like to add this list to your Task Buddy account?
              </p>

              {addedSuccess ? (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-neu-btn text-xs font-bold flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4" /> Added to your account! Redirecting...
                </div>
              ) : (
                <button
                  onClick={handleAddListToAccount}
                  disabled={isAdding}
                  className="w-full neu-accent-button py-3 rounded-neu-btn text-sm font-bold flex items-center justify-center gap-2 hover:opacity-95 active:scale-98 transition-all"
                >
                  <FolderPlus className="w-4 h-4" />
                  {isAdding ? 'Adding List...' : 'Add List to My Account'}
                </button>
              )}

              <button
                onClick={() => navigate('/dashboard')}
                className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center justify-center gap-1 mx-auto pt-2"
              >
                Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};

export default SharePage;
