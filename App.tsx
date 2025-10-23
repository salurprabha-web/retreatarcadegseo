import React, { useState, useCallback, useEffect } from 'react';
import PublicWebsite from './components/public/PublicWebsite';
import AdminPanel from './components/AdminPanel';
import LoginScreen from './components/LoginScreen';
import { supabase } from './services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import Loader from './components/common/Loader';

interface ToastState {
  message: string;
  type: 'success' | 'error';
}

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


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [route, setRoute] = useState(window.location.hash || '#/');

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    setLoading(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // No need to set loading here as the initial state is handled above
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Listen for hash changes to control top-level routing
  useEffect(() => {
    const handleHashChange = () => {
      setRoute(window.location.hash || '#/');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);


  const handleLogout = useCallback(async () => {
    window.location.hash = '#/'; // Redirect to public site on logout
    await supabase.auth.signOut();
  }, []);

  if (loading) {
    return (
      <div className="bg-brand-dark min-h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  // Corrected router logic: path-based routing first, then session for protection.
  const renderView = () => {
    const isAdminPath = route.startsWith('#/admin');

    if (isAdminPath) {
      if (session) {
        // User is logged in and on an admin path
        return <AdminPanel onLogout={handleLogout} showToast={showToast} />;
      } else {
        // User is not logged in but trying to access an admin path
        return <LoginScreen />;
      }
    } else {
      // Any other path is the public website
      return <PublicWebsite route={route} />;
    }
  };

  return (
    <div className="bg-brand-dark min-h-screen">
      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}
      {renderView()}
    </div>
  );
};

export default App;