import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Eye, EyeOff, Mail, Lock, LogIn } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { createDesktopAuthCode } from '../lib/desktop-auth.service';

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signOut, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Desktop app redirect params
  const source = searchParams.get('source');
  const redirect = searchParams.get('redirect');
  const isDesktop = source === 'desktop' && !!redirect;

  // Preserve desktop params for cross-page links
  const desktopParams = isDesktop
    ? `?source=desktop&redirect=${encodeURIComponent(redirect!)}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      // If there's already an active session, sign out first so we can sign in fresh
      if (isAuthenticated) {
        await signOut();
      }
      await signIn(email, password);

      // ── Desktop app callback ──────────────────────────────────
      if (isDesktop) {
        try {
          const code = await createDesktopAuthCode();
          if (code) {
            // Redirect back to the desktop app with the one-time code
            window.location.href = `${redirect}?code=${encodeURIComponent(code)}`;
            return;
          }
        } catch (exchangeErr) {
          console.error('Desktop auth code generation failed:', exchangeErr);
          // Fall through to normal navigation
        }
      }

      navigate('/account');
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Continue as the currently-signed-in user (desktop flow).
   * Skips creating a new session — just generates the auth code.
   */
  const handleContinueAsUser = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (isDesktop) {
        const code = await createDesktopAuthCode();
        if (code) {
          window.location.href = `${redirect}?code=${encodeURIComponent(code)}`;
          return;
        }
      }
      navigate('/account');
    } catch (err: any) {
      setError(err.message || 'Failed to continue');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Sign out the current session so the user can log in with different credentials.
   */
  const handleUseDifferentAccount = async () => {
    setError('');
    try {
      await signOut();
    } catch (err: any) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <div className="min-h-screen text-ev-text-primary flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00d4aa]/8 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00bcd4]/8 rounded-full blur-3xl" />
      </div>

      {/* Header / Logo */}
      <div className="relative z-10 px-6 pt-8">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center shadow-lg shadow-[rgba(0,212,170,0.3)] group-hover:shadow-[rgba(0,212,170,0.5)] transition-shadow">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-ev-text-primary">Luis&Co. Photobooth</span>
        </Link>
      </div>

      {/* Sign In Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-ev-surface/70 backdrop-blur-xl border border-ev-border/60 rounded-2xl p-8 shadow-[var(--ev-shadow-lg)]">

            {/* ── "Continue as" banner when user already has a session ── */}
            {!loading && isAuthenticated && user && (
              <div className="mb-6 p-4 rounded-xl bg-[#0a0e14]/60 border border-ev-border/60">
                <p className="text-sm text-ev-text-secondary mb-3">
                  You're already signed in as:
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center text-[#0a0e14] font-bold text-lg">
                    {user.avatarInitial}
                  </div>
                  <div>
                    <p className="font-semibold text-ev-text-primary text-sm">{user.name}</p>
                    <p className="text-ev-text-muted text-xs">{user.email}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={handleContinueAsUser}
                    disabled={submitting}
                    className="w-full h-10 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] transition-all duration-300 disabled:opacity-60"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {submitting ? 'Connecting…' : `Continue as ${user.name}`}
                  </Button>
                  <button
                    type="button"
                    onClick={handleUseDifferentAccount}
                    className="text-sm text-ev-text-muted hover:text-ev-accent transition-colors"
                  >
                    Use a different account
                  </button>
                </div>
                {error && <p className="text-xs text-ev-danger mt-2">{error}</p>}
              </div>
            )}

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-ev-text-primary mb-2">Welcome</h1>
              <p className="text-ev-text-secondary text-sm">Sign in to your Luis&Co. Photobooth account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-ev-text-secondary">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ev-text-muted" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11 bg-[#0a0e14]/60 border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus-visible:border-ev-accent/60 focus-visible:ring-[rgba(0,212,170,0.2)]"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-ev-text-secondary">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ev-text-muted" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-11 h-11 bg-[#0a0e14]/60 border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus-visible:border-ev-accent/60 focus-visible:ring-[rgba(0,212,170,0.2)]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ev-text-muted hover:text-ev-text-secondary transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Forgot Password */}
              <div className="flex items-center justify-between">
                {error && <p className="text-xs text-ev-danger">{error}</p>}
                <button
                  type="button"
                  className="text-sm text-ev-accent hover:text-ev-accent-hover transition-colors ml-auto"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300 disabled:opacity-60"
              >
                {submitting ? 'Signing in…' : 'Sign In'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-7">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-ev-border/80" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-ev-surface/70 px-3 text-ev-text-muted">or</span>
              </div>
            </div>

            {/* Create Account */}
            <div className="text-center">
              <p className="text-sm text-ev-text-secondary">
                Don&apos;t have an account?{' '}
                <Link
                  to={`/signup${desktopParams}`}
                  className="text-ev-accent hover:text-ev-accent-hover font-medium transition-colors"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
