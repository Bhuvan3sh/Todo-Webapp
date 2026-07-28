import React, { createContext, useContext, useEffect, useReducer, useState } from 'react';
import { List, Task, ToastNotification } from '../types';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AppState {
  lists: List[];
  tasks: Task[];
  activeListId: string | null;
  searchQuery: string;
  toasts: ToastNotification[];
  isLoadingData: boolean;
}

type Action =
  | { type: 'SET_LISTS'; payload: List[] }
  | { type: 'ADD_LIST'; payload: List }
  | { type: 'UPDATE_LIST'; payload: List }
  | { type: 'DELETE_LIST'; payload: string }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'REORDER_TASKS'; payload: Task[] }
  | { type: 'SET_ACTIVE_LIST'; payload: string | null }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'ADD_TOAST'; payload: ToastNotification }
  | { type: 'REMOVE_TOAST'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AppState = {
  lists: [],
  tasks: [],
  activeListId: null,
  searchQuery: '',
  toasts: [],
  isLoadingData: true,
};

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LISTS':
      return { ...state, lists: action.payload };
    case 'ADD_LIST':
      return { ...state, lists: [...state.lists, action.payload], activeListId: action.payload.id };
    case 'UPDATE_LIST':
      return {
        ...state,
        lists: state.lists.map((l) => (l.id === action.payload.id ? action.payload : l)),
      };
    case 'DELETE_LIST': {
      const remainingLists = state.lists.filter((l) => l.id !== action.payload);
      const newActiveId = state.activeListId === action.payload
        ? (remainingLists[0]?.id || null)
        : state.activeListId;
      return {
        ...state,
        lists: remainingLists,
        tasks: state.tasks.filter((t) => t.list_id !== action.payload),
        activeListId: newActiveId,
      };
    }
    case 'SET_TASKS':
      return { ...state, tasks: action.payload };
    case 'ADD_TASK':
      return { ...state, tasks: [...state.tasks, action.payload] };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };
    case 'DELETE_TASK':
      return { ...state, tasks: state.tasks.filter((t) => t.id !== action.payload) };
    case 'REORDER_TASKS':
      return { ...state, tasks: action.payload };
    case 'SET_ACTIVE_LIST':
      return { ...state, activeListId: action.payload };
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'ADD_TOAST':
      return { ...state, toasts: [...state.toasts, action.payload] };
    case 'REMOVE_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.payload) };
    case 'SET_LOADING':
      return { ...state, isLoadingData: action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  showToast: (message: string, type?: 'success' | 'error' | 'info', undoAction?: () => void, undoLabel?: string) => void;
  removeToast: (id: string) => void;
  createList: (listData: Omit<List, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateList: (list: List) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  createTask: (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'position'>) => Promise<void>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  reorderTasks: (reorderedTasks: Task[]) => Promise<void>;
  // Modals state
  isListModalOpen: boolean;
  setIsListModalOpen: (open: boolean) => void;
  editingList: List | null;
  setEditingList: (list: List | null) => void;
  isTaskModalOpen: boolean;
  setIsTaskModalOpen: (open: boolean) => void;
  editingTask: Task | null;
  setEditingTask: (task: Task | null) => void;
  isShortcutsModalOpen: boolean;
  setIsShortcutsModalOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const SEED_LISTS: List[] = [
  {
    id: 'seed-list-1',
    user_id: 'demo-user-123',
    title: '🚀 Launch Project Task Buddy',
    description: 'Finalize UI, export functionality, and production testing',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    color: '#6C63FF',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seed-list-2',
    user_id: 'demo-user-123',
    title: '🎨 Design & Neumorphism',
    description: 'Tweak shadow physics and typography',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    color: '#10B981',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const SEED_TASKS: Task[] = [
  {
    id: 'seed-task-1',
    list_id: 'seed-list-1',
    user_id: 'demo-user-123',
    title: 'Review Neumorphic Box Shadow Specs',
    description: 'Ensure 6px 6px 12px #A3B1C6 shadow formula matches',
    is_completed: true,
    priority: 'high',
    due_date: new Date().toISOString(),
    position: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seed-task-2',
    list_id: 'seed-list-1',
    user_id: 'demo-user-123',
    title: 'Test Printable PDF Export',
    description: 'Verify printable checkboxes, priority badges, and header formatting in jsPDF',
    is_completed: false,
    priority: 'medium',
    due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    position: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'seed-task-3',
    list_id: 'seed-list-1',
    user_id: 'demo-user-123',
    title: 'Verify Drag & Drop Task Reordering',
    description: 'Test smooth drag handles with @dnd-kit/core',
    is_completed: false,
    priority: 'low',
    due_date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
    position: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { user } = useAuth();

  // Modals state
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [editingList, setEditingList] = useState<List | null>(null);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Load User Data (Supabase or Local Storage)
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'SET_LISTS', payload: [] });
      dispatch({ type: 'SET_TASKS', payload: [] });
      dispatch({ type: 'SET_ACTIVE_LIST', payload: null });
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    const fetchData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });

      if (isSupabaseConfigured() && supabase) {
        try {
          const { data: listsData } = await supabase
            .from('lists')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

          const { data: tasksData } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('position', { ascending: true });

          const loadedLists: List[] = listsData || [];
          const loadedTasks: Task[] = tasksData || [];

          dispatch({ type: 'SET_LISTS', payload: loadedLists });
          dispatch({ type: 'SET_TASKS', payload: loadedTasks });
          dispatch({ type: 'SET_ACTIVE_LIST', payload: loadedLists[0]?.id || null });
        } catch (error) {
          console.error('Error fetching Supabase data:', error);
        }
      } else {
        const localLists = localStorage.getItem(`neurotask_lists_${user.id}`);
        const localTasks = localStorage.getItem(`neurotask_tasks_${user.id}`);

        let lists: List[] = localLists ? JSON.parse(localLists) : SEED_LISTS;
        let tasks: Task[] = localTasks ? JSON.parse(localTasks) : SEED_TASKS;

        dispatch({ type: 'SET_LISTS', payload: lists });
        dispatch({ type: 'SET_TASKS', payload: tasks });
        dispatch({ type: 'SET_ACTIVE_LIST', payload: lists[0]?.id || null });

        localStorage.setItem(`neurotask_lists_${user.id}`, JSON.stringify(lists));
        localStorage.setItem(`neurotask_tasks_${user.id}`, JSON.stringify(tasks));
      }

      dispatch({ type: 'SET_LOADING', payload: false });
    };

    fetchData();
  }, [user]);

  const showToast = (
    message: string,
    type: 'success' | 'error' | 'info' = 'success',
    undoAction?: () => void,
    undoLabel: string = 'Undo'
  ) => {
    const id = 'toast_' + Date.now() + Math.random().toString().slice(2, 6);
    dispatch({
      type: 'ADD_TOAST',
      payload: { id, message, type, undoAction, undoLabel },
    });

    setTimeout(() => {
      dispatch({ type: 'REMOVE_TOAST', payload: id });
    }, 4000);
  };

  const removeToast = (id: string) => {
    dispatch({ type: 'REMOVE_TOAST', payload: id });
  };

  const syncLocal = (updatedLists?: List[], updatedTasks?: Task[]) => {
    if (!user || isSupabaseConfigured()) return;
    if (updatedLists) localStorage.setItem(`neurotask_lists_${user.id}`, JSON.stringify(updatedLists));
    if (updatedTasks) localStorage.setItem(`neurotask_tasks_${user.id}`, JSON.stringify(updatedTasks));
  };

  const createList = async (listData: Omit<List, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;
    const now = new Date().toISOString();
    const newList: List = {
      ...listData,
      id: isSupabaseConfigured() ? crypto.randomUUID() : 'list_' + Date.now(),
      user_id: user.id,
      created_at: now,
      updated_at: now,
    };

    dispatch({ type: 'ADD_LIST', payload: newList });
    syncLocal([...state.lists, newList]);
    showToast(`List "${newList.title}" created`, 'success');

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('lists').insert(newList);
    }
  };

  const updateList = async (list: List) => {
    const updated = { ...list, updated_at: new Date().toISOString() };
    dispatch({ type: 'UPDATE_LIST', payload: updated });
    syncLocal(state.lists.map((l) => (l.id === updated.id ? updated : l)));
    showToast(`List updated`, 'info');

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('lists').update(updated).eq('id', updated.id);
    }
  };

  const deleteList = async (listId: string) => {
    const targetList = state.lists.find((l) => l.id === listId);
    dispatch({ type: 'DELETE_LIST', payload: listId });
    syncLocal(
      state.lists.filter((l) => l.id !== listId),
      state.tasks.filter((t) => t.list_id !== listId)
    );
    showToast(`List "${targetList?.title || ''}" deleted`, 'info');

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('lists').delete().eq('id', listId);
    }
  };

  const createTask = async (taskData: Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'position'>) => {
    if (!user) return;
    const listTasks = state.tasks.filter((t) => t.list_id === taskData.list_id);
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskData,
      id: isSupabaseConfigured() ? crypto.randomUUID() : 'task_' + Date.now(),
      user_id: user.id,
      position: listTasks.length,
      created_at: now,
      updated_at: now,
    };

    dispatch({ type: 'ADD_TASK', payload: newTask });
    syncLocal(undefined, [...state.tasks, newTask]);
    showToast('Task added', 'success');

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('tasks').insert(newTask);
    }
  };

  const updateTask = async (task: Task) => {
    const updated = { ...task, updated_at: new Date().toISOString() };
    dispatch({ type: 'UPDATE_TASK', payload: updated });
    syncLocal(undefined, state.tasks.map((t) => (t.id === updated.id ? updated : t)));

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('tasks').update(updated).eq('id', updated.id);
    }
  };

  const deleteTask = async (taskId: string) => {
    const targetTask = state.tasks.find((t) => t.id === taskId);
    if (!targetTask) return;

    dispatch({ type: 'DELETE_TASK', payload: taskId });
    const updatedTasks = state.tasks.filter((t) => t.id !== taskId);
    syncLocal(undefined, updatedTasks);

    showToast(
      `Task deleted`,
      'info',
      async () => {
        dispatch({ type: 'ADD_TASK', payload: targetTask });
        syncLocal(undefined, [...updatedTasks, targetTask]);
        if (isSupabaseConfigured() && supabase) {
          await supabase.from('tasks').insert(targetTask);
        }
      },
      'Undo'
    );

    if (isSupabaseConfigured() && supabase) {
      await supabase.from('tasks').delete().eq('id', taskId);
    }
  };

  const reorderTasks = async (reorderedTasks: Task[]) => {
    dispatch({ type: 'REORDER_TASKS', payload: reorderedTasks });
    syncLocal(undefined, reorderedTasks);

    if (isSupabaseConfigured() && supabase) {
      const updates = reorderedTasks.map((t, idx) => ({
        id: t.id,
        position: idx,
        list_id: t.list_id,
        user_id: t.user_id,
        title: t.title,
      }));
      await supabase.from('tasks').upsert(updates);
    }
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        showToast,
        removeToast,
        createList,
        updateList,
        deleteList,
        createTask,
        updateTask,
        deleteTask,
        reorderTasks,
        isListModalOpen,
        setIsListModalOpen,
        editingList,
        setEditingList,
        isTaskModalOpen,
        setIsTaskModalOpen,
        editingTask,
        setEditingTask,
        isShortcutsModalOpen,
        setIsShortcutsModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
