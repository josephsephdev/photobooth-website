import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Eye, EyeOff, Mail, Lock, UserIcon, UserCircle, LogOut } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { createDesktopAuthCode } from '../lib/desktop-auth.service';
import { getCurrentUser, signOut as authSignOut } from '../lib/auth.service';

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { signUp } = useAuth();
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

  // ── Desktop: detect existing session ────────────────────────────
  const [existingUser, setExistingUser] = useState<{ name: string; email: string } | null>(null);
  const [checkingSession, setCheckingSession] = useState(isDesktop);
  const [continuingAs, setContinuingAs] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;
    getCurrentUser()
      .then((u) => {
        if (u) setExistingUser({ name: u.name, email: u.email });
      })
      .catch(() => { /* no session */ })
      .finally(() => setCheckingSession(false));
  }, [isDesktop]);

  /** Desktop: continue with the already-logged-in account */
  const handleContinueAsExisting = async () => {
    setContinuingAs(true);
    setError('');
    try {
      const code = await createDesktopAuthCode();
      if (code) {
        window.location.href = `${redirect}?code=${encodeURIComponent(code)}`;
        return;
      }
      setError('Failed to generate desktop auth code. Please try again.');
    } catch (err: any) {
      console.error('Desktop auth code generation failed:', err);
      setError(err.message || 'Failed to generate desktop auth code');
    } finally {
      setContinuingAs(false);
    }
  };

  /** Desktop: sign out the current website session so user can create a new account */
  const handleUseAnotherAccount = async () => {
    setError('');
    try {
      await authSignOut();
      setExistingUser(null);
    } catch {
      setExistingUser(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── Client-side validation ──
    if (!fullName.trim()) {
      setError('Full name is required');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {      // Desktop flow: ensure no stale session blocks account creation
      if (isDesktop) {
        try { await authSignOut(); } catch { /* no session to clear — fine */ }
      }
      await signUp(email, password, fullName.trim());

      // ── Desktop app callback ──────────────────────────────────
      if (isDesktop) {
        try {
          const code = await createDesktopAuthCode();
          if (code) {
            window.location.href = `${redirect}?code=${encodeURIComponent(code)}`;
            return;
          }
        } catch (exchangeErr) {
          console.error('Desktop auth code generation failed:', exchangeErr);
        }
      }

      // Redirect to a "check your email" page after successful signup
      navigate('/verify-email-sent');
    } catch (err: any) {
      setError(err.message || 'Sign up failed');
    } finally {
      setSubmitting(false);
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
          <span className="text-xl font-bold text-ev-text-primary">PhotoBooth Pro</span>
        </Link>
      </div>

      {/* Sign Up Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-ev-surface/70 backdrop-blur-xl border border-ev-border/60 rounded-2xl p-8 shadow-[var(--ev-shadow-lg)]">
            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-ev-text-primary mb-2">Create your account</h1>
              <p className="text-ev-text-secondary text-sm">Get started with PhotoBooth Pro</p>
            </div>

            {/* Desktop: checking for existing session */}
            {isDesktop && checkingSession && (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-ev-accent/30 border-t-ev-accent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-sm text-ev-text-muted">Checking session…</p>
              </div>
            )}

            {/* Desktop: existing session detected */}
            {isDesktop && !checkingSession && existingUser && (
              <div className="space-y-4 mb-6">
                <div className="bg-[#0a0e14]/60 border border-ev-border/60 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <UserCircle className="w-10 h-10 text-ev-accent shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ev-text-primary truncate">{existingUser.name || existingUser.email}</p>
                      <p className="text-xs text-ev-text-muted truncate">{existingUser.email}</p>
                    </div>
                  </div>
                  <p className="text-xs text-ev-text-secondary mb-3">
                    You're already signed in on this browser. Continue with this account to sign in to your desktop app.
                  </p>
                  {error && <p className="text-xs text-ev-danger mb-2">{error}</p>}
                  <Button
                    onClick={handleContinueAsExisting}
                    disabled={continuingAs}
                    className="w-full h-10 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300 disabled:opacity-60"
                  >
                    {continuingAs ? 'Connecting to desktop app…' : `Continue as ${existingUser.name || existingUser.email}`}
                  </Button>
                </div>

                <button
                  onClick={handleUseAnotherAccount}
                  className="w-full flex items-center justify-center gap-2 text-sm text-ev-text-muted hover:text-ev-accent transition-colors py-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Use a different account
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ev-border/80" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-ev-surface/70 px-3 text-ev-text-muted">or create a new account below</span>
                  </div>
                </div>
              </div>
            )}

            {/* Form — hidden during desktop session check */}
            {(!isDesktop || !checkingSession) && (<>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-ev-text-secondary">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ev-text-muted" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-10 h-11 bg-[#0a0e14]/60 border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus-visible:border-ev-accent/60 focus-visible:ring-[rgba(0,212,170,0.2)]"
                    required
                  />
                </div>
              </div>

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
                    placeholder="Create a password"
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

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-ev-text-secondary">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ev-text-muted" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 pr-11 h-11 bg-[#0a0e14]/60 border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus-visible:border-ev-accent/60 focus-visible:ring-[rgba(0,212,170,0.2)]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ev-text-muted hover:text-ev-text-secondary transition-colors"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              {error && <p className="text-xs text-ev-danger">{error}</p>}
              <Button
                type="submit"
                disabled={submitting}
                className="w-full h-11 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300 mt-2 disabled:opacity-60"
              >
                {submitting ? 'Creating account…' : 'Create Account'}
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

            {/* Sign In link */}
            <div className="text-center">
              <p className="text-sm text-ev-text-secondary">
                Already have an account?{' '}
                <Link
                  to={`/signin${desktopParams}`}
                  className="text-ev-accent hover:text-ev-accent-hover font-medium transition-colors"
                >
                  Sign In
                </Link>
              </p>
            </div>
            </>)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
