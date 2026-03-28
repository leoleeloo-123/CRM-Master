import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, Button } from '../components/Common';
import { LogIn, UserPlus, Users, Database } from 'lucide-react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cnptexlyzhfkqtlorxjt.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_bq1-NO6E0uAoDLWviGtgfA_tnCwC245';
const supabase = createClient(supabaseUrl, supabaseKey);

const INVITE_CODE = import.meta.env.VITE_INVITE_CODE || 'NAVI2026';

interface AuthPageProps {
  onLogin: (user: any, mode: 'team' | 'local', setAsDefault?: boolean) => void;
  onSkip: (setAsDefault?: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onSkip }) => {
  const [mode, setMode] = useState<'select' | 'login' | 'register'>('select');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError(error.message);
    } else {
      onLogin(data.user, 'team', setAsDefault);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inviteCode !== INVITE_CODE) {
      setError('Invalid invite code');
      return;
    }

    setLoading(true);
    setError('');

    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      setError(error.message);
    } else {
      onLogin(data.user, 'team', setAsDefault);
    }
    setLoading(false);
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tight">CRM Master</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Choose your data storage mode</p>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setMode('login')}
              className="w-full p-6 rounded-2xl border-2 border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all text-left"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wide">Team Mode</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Share data with your team via cloud</p>
                </div>
              </div>
            </button>

            <button
              onClick={() => onSkip(setAsDefault)}
              className="w-full p-6 rounded-2xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors">
                  <Database className="w-6 h-6 text-slate-600 dark:text-slate-300" />
                </div>
                <div className="flex-1">
                  <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wide">Local Mode</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Store data only on this device</p>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                <label 
                  className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-400 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={setAsDefault}
                    onChange={(e) => setSetAsDefault(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Remember this choice for next time</span>
                </label>
              </div>
            </button>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-400 dark:text-slate-500 italic leading-relaxed">
              <strong className="text-slate-500 dark:text-slate-400 not-italic">Team Mode:</strong> Connect to cloud database for team collaboration. Requires invite code to register.
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 italic leading-relaxed mt-2">
              <strong className="text-slate-500 dark:text-slate-400 not-italic">Local Mode:</strong> Store data only on this device. No registration needed. Data stays private to this browser.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (mode === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Team Login</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Access shared team database</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-bold">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              <LogIn className="w-5 h-5 mr-2" />
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>

          <div className="flex justify-between text-sm">
            <button onClick={() => setMode('select')} className="text-slate-500 hover:text-blue-600 font-bold">
              ← Back
            </button>
            <button onClick={() => setMode('register')} className="text-blue-600 hover:text-blue-700 font-bold">
              Create account →
            </button>
          </div>
        </Card>
      </div>
    );
  }

  if (mode === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
        <Card className="max-w-md w-full p-8 space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Create Account</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">Join the team (invite required)</p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Invite Code</label>
              <input
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="NAVI2026"
                className="w-full px-4 py-3 rounded-xl border-2 border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:border-blue-500 focus:outline-none"
                required
              />
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-bold">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              <UserPlus className="w-5 h-5 mr-2" />
              {loading ? 'Creating...' : 'Create Account'}
            </Button>
          </form>

          <div className="flex justify-between text-sm">
            <button onClick={() => setMode('select')} className="text-slate-500 hover:text-blue-600 font-bold">
              ← Back
            </button>
            <button onClick={() => setMode('login')} className="text-blue-600 hover:text-blue-700 font-bold">
              Already have account →
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return null;
};

export default AuthPage;
