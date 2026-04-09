import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignIn } from '@clerk/clerk-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function AuthPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'signin' ? '/auth/login' : '/auth/register';
      const payload =
        mode === 'signin'
          ? { email, password }
          : { email, password, name, username };

      const { data } = await api.post(endpoint, payload);
      setAuth(data.accessToken, data.user);
      navigate(data.needsOnboarding ? '/onboarding' : '/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-[#a78bfa]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#7c3aed]/5 blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center">
              <span className="text-white text-lg font-bold font-mono">D</span>
            </div>
            <h1 className="text-2xl font-bold text-[#f1f3fc] font-['Space_Grotesk']">DevVerse</h1>
          </div>
          <p className="text-[#8a98b3] text-sm font-['Inter']">
            {mode === 'signin' ? 'Welcome back, developer.' : 'Create your developer profile.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111720]/80 backdrop-blur-[20px] border border-[#1e2a3a] rounded-2xl p-8 shadow-xl">
          {/* Tab Toggle */}
          <div className="flex rounded-lg bg-[#0a0d12] p-1 gap-1 mb-8">
            {(['signin', 'signup'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => { setMode(tab); setError(''); }}
                className={`flex-1 py-2 rounded-md text-sm font-['Inter'] font-medium transition-all duration-200 ${
                  mode === tab
                    ? 'bg-[#1e2a3a] text-[#f1f3fc] shadow'
                    : 'text-[#8a98b3] hover:text-[#f1f3fc]'
                }`}
              >
                {tab === 'signin' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-sm font-['Inter']">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === 'signup' && (
              <>
                <div>
                  <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                    placeholder="Ada Lovelace"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, '_'))}
                    required
                    className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-mono text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                    placeholder="ada_dev"
                  />
                </div>
              </>
            )}

            <div>
              <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                placeholder="dev@devverse.io"
              />
            </div>

            <div>
              <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-['Inter'] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {mode === 'signin' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                mode === 'signin' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[#1e2a3a]" />
            <span className="text-xs text-[#3a4458] font-['Inter']">or continue with</span>
            <div className="flex-1 h-px bg-[#1e2a3a]" />
          </div>

          {/* Google OAuth via Clerk */}
          <OAuthButton />
        </div>

        <p className="text-center text-xs text-[#3a4458] mt-6 font-['Inter']">
          By continuing, you agree to DevVerse's terms of service.
        </p>
      </div>
    </div>
  );
}

function OAuthButton() {
  const { signIn } = useSignIn();
  const [loading, setLoading] = useState(false);

  const handleGoogleAuth = async () => {
    if (!signIn) return;
    setLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: `${window.location.origin}/oauth-callback`,
        redirectUrlComplete: `${window.location.origin}/oauth-callback`,
      });
    } catch (error) {
      console.error('Google OAuth failed:', error);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleAuth}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm hover:border-[#a78bfa]/30 hover:bg-[#111720] transition-all duration-200 disabled:opacity-50"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
      </svg>
      {loading ? 'Redirecting...' : 'Continue with Google'}
    </button>
  );
}
