import React, { useState, useEffect } from 'react';
import type { Session } from '@supabase/supabase-js';
import { createClient } from './lib/supabase/client';
import ToastProvider from './components/ToastProvider';
import LoginScreen from './components/LoginScreen';
import AdminPanel from './components/AdminPanel';
import PublicWebsite from './components/public/PublicWebsite';
import Loader from './components/common/Loader';

const supabase = createClient();

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [hash, setHash] = useState(window.location.hash);

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };
        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        const handleHashChange = () => {
            setHash(window.location.hash);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => {
            window.removeEventListener('hashchange', handleHashChange);
        };
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-brand-dark">
                <Loader />
            </div>
        );
    }
    
    const path = hash.replace(/^#/, '') || '/';

    const renderContent = () => {
        if (path.startsWith('/admin')) {
            return session ? <AdminPanel path={path} /> : <LoginScreen />;
        }
        if (path === '/login') {
            if (session) {
                window.location.hash = '/admin';
                return null;
            }
            return <LoginScreen />;
        }
        return <PublicWebsite path={path} />;
    };

    return <ToastProvider>{renderContent()}</ToastProvider>;
};

export default App;
