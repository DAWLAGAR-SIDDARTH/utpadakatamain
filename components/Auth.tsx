import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, AppLogo } from './UIComponents';
import { User } from '../types';
import { GOOGLE_CLIENT_ID } from '../constants';

declare global {
  interface Window {
    google: any;
  }
}

interface AuthProps {
  onLogin: (user: User) => void;
}

// Helper to decode JWT from Google
const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
};

// Google SVG Icon (for fallback button)
const GoogleIcon = () => (
  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const [isGoogleLoaded, setIsGoogleLoaded] = useState(false);

  // Initialize Real Google Button
  useEffect(() => {
    // Check if Google script is loaded and Client ID is set (not placeholder)
    const canLoadGoogle = window.google && GOOGLE_CLIENT_ID && !GOOGLE_CLIENT_ID.includes('YOUR_GOOGLE_CLIENT_ID');

    if (canLoadGoogle) {
      try {
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: handleGoogleCallback,
          auto_select: false
        });
        
        window.google.accounts.id.renderButton(
          googleButtonRef.current!,
          { theme: 'outline', size: 'large', width: '100%' } // options
        );
        setIsGoogleLoaded(true);
      } catch (err) {
        console.error("Error initializing Google Sign-In", err);
      }
    }
  }, []);

  const handleGoogleCallback = (response: any) => {
    const payload = decodeJwt(response.credential);
    if (payload) {
      onLogin({
        id: payload.sub,
        googleId: payload.sub,
        name: payload.name,
        email: payload.email,
        avatar: payload.picture,
        preferences: { theme: 'light' }
      });
    }
  };

  const handleMockGoogleLogin = () => {
    // Fallback if no real Google Auth is configured
    onLogin({
      id: 'google-user-' + Date.now(),
      googleId: '123456789',
      name: 'Dev User (Mock)',
      email: 'user@gmail.com',
      avatar: 'https://lh3.googleusercontent.com/a/default-user',
      preferences: { theme: 'light' }
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin({
        id: 'user-' + Date.now(),
        name: email.split('@')[0],
        email: email,
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=0ea5e9&color=fff`,
        preferences: { theme: 'light' }
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 relative overflow-hidden transition-colors duration-200">
       {/* Background Decoration */}
       <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <div className="absolute top-10 left-10 w-64 h-64 bg-blue-400 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-400 rounded-full blur-3xl"></div>
       </div>

      <div className="w-full max-w-md bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-xl z-10 animate-fade-in border border-slate-100 dark:border-slate-700">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-4 text-brand-600 dark:text-brand-400">
            <AppLogo className="w-16 h-16" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Welcome to Utpadakata</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Sign in to access your workspace</p>
        </div>

        <div className="space-y-4">
          
          {/* Real Google Button Container */}
          <div ref={googleButtonRef} className={`w-full flex justify-center ${!isGoogleLoaded ? 'hidden' : ''}`}></div>

          {/* Fallback Mock Button if real Google Auth isn't set up */}
          {!isGoogleLoaded && (
            <button 
              onClick={handleMockGoogleLogin}
              className="w-full flex items-center justify-center px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl shadow-sm bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 font-medium transition-all"
            >
              <GoogleIcon />
              Continue with Google (Dev)
            </button>
          )}

          {!isGoogleLoaded && (
             <p className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded">
               Note: To enable real Google Login, set your Client ID in <code>constants.ts</code>
             </p>
          )}

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-slate-400 text-sm">or continue with email</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-700"></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Email" 
              type="email" 
              placeholder="name@work-email.com" 
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-slate-50 dark:bg-slate-900"
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="bg-slate-50 dark:bg-slate-900"
            />
            
            <Button className="w-full h-12 text-lg shadow-lg shadow-brand-500/20">
              Sign In
            </Button>
          </form>
        </div>

        <p className="mt-8 text-center text-xs text-slate-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};