import React, { useState, useCallback, createContext, useContext, ReactNode, useEffect } from 'react';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

interface ToastContextType {
  showToast: (message: string, type: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

const Toast: React.FC<{ toast: ToastState; onClose: () => void }> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const typeClasses = {
    success: 'bg-green-600 border-green-500',
    error: 'bg-red-600 border-red-500',
  };

  return (
    <div className={`fixed top-8 right-8 z-[100] p-4 rounded-lg shadow-2xl border text-white ${typeClasses[toast.type]} animate-fade-in-up`}>
      <div className="flex items-center">
        <p className="mr-4">{toast.message}</p>
        <button onClick={onClose} className="text-xl font-light opacity-80 hover:opacity-100">&times;</button>
      </div>
    </div>
  );
};

// Fix: Standardize prop definition to prevent type conflicts.
const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastState | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  const value = { showToast };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
    </ToastContext.Provider>
  );
};

export default ToastProvider;