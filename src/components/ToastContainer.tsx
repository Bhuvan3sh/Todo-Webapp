import React from 'react';
import { useApp } from '../context/AppContext';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { state, removeToast } = useApp();

  if (state.toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col space-y-3 max-w-sm w-full px-4 sm:px-0">
      {state.toasts.map((toast) => (
        <div
          key={toast.id}
          className="neu-raised rounded-neu-btn p-4 flex items-center justify-between border-l-4 border-[#6C63FF] shadow-lg animate-bounce-short transition-all duration-300"
        >
          <div className="flex items-center space-x-3 pr-2">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-[#6C63FF] flex-shrink-0" />}
            <span className="text-sm font-medium text-gray-800">
              {toast.message}
            </span>
          </div>

          <div className="flex items-center space-x-2">
            {toast.undoAction && (
              <button
                onClick={() => {
                  toast.undoAction?.();
                  removeToast(toast.id);
                }}
                className="px-2.5 py-1 text-xs font-bold text-[#6C63FF] neu-raised-sm neu-button rounded-md hover:bg-[#6C63FF] hover:text-white transition-colors"
              >
                {toast.undoLabel || 'Undo'}
              </button>
            )}

            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
