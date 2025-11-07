import React, { useState } from 'react';
import Button from './common/Button';
import Input from './common/Input';
import Card from './common/Card';
import { createClient } from '../lib/supabase/client';

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // On success, redirect to the admin dashboard.
      // The App component will handle re-rendering.
      window.location.hash = '/admin';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-brand-dark p-4">
      <div className="w-full max-w-md">
         <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-brand-accent font-poppins">Retreat</h1>
            <h1 className="text-3xl font-bold text-white font-poppins ml-1">Arcade</h1>
            <p className="text-gray-400 mt-2">Admin Panel Login</p>
        </div>
        <Card title="Secure Login">
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              disabled={loading}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              required
              disabled={loading}
            />
            {error && <p className="text-red-400 text-sm text-center">{error}</p>}
            <Button type="submit" className="w-full" isLoading={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
             <p className="text-center text-xs text-gray-500">
                Hint: A user needs to be created in the Supabase Auth section first.
            </p>
          </form>
        </Card>
        <div className="text-center mt-6">
            <a href="#/" className="text-sm text-gray-400 hover:text-brand-accent transition-colors">
                &larr; Back to Public Website
            </a>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;