export type PriorityLevel = 'low' | 'medium' | 'high';
export type ViewMode = 'today' | 'upcoming' | 'all' | 'list';

export interface UserProfile {
  id: string;
  email: string;
  created_at?: string;
}

export interface List {
  id: string;
  user_id: string;
  title: string;
  description?: string | null;
  deadline?: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  list_id: string;
  user_id: string;
  title: string;
  description?: string | null;
  is_completed: boolean;
  priority: PriorityLevel;
  due_date?: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface ToastNotification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  undoAction?: () => void;
  undoLabel?: string;
  duration?: number;
}

