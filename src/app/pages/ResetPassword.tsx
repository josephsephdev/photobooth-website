/**
 * ResetPassword — callback page for password reset links
 *
 * When the user clicks the reset link in their email,
 * Appwrite redirects them to: /reset-password?userId=xxx&secret=yyy
 *
 * This page allows them to enter a new password and complete the reset.
 */

import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Lock, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { completePasswordReset } from '../lib/auth.service';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState<'loading' | 'form' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const userId = searchParams.get('userId');
  const secret = searchParams.get('secret');

  // Check if we have the required params
  useEffect(() => {
    if (!userId || !secret) {
      setErrorMsg('Invalid reset link. Missing userId or secret.');
      setStatus('error');
    } else {
      setStatus('form');
    }
  }, [userId, secret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Validation
    if (!newPassword.trim()) {
      setFormError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setFormError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    setSubmitting(true);

    try {
      if (!userId || !secret) throw new Error('Missing recovery parameters');
      
      await completePasswordReset(userId, secret, newPassword);
      setStatus('success');
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to reset password. The link may have expired.');
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen text-ev-text-primary flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00d4aa]/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00bcd4]/6 rounded-full blur-3xl" />
      </div>

      {/* Logo */}
      <div className="relative z-10 px-6 pt-8">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center shadow-lg shadow-[rgba(0,212,170,0.3)] group-hover:shadow-[rgba(0,212,170,0.5)] transition-shadow">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-ev-text-primary">Luis&Co. Photobooth</span>
        </Link>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-ev-surface/70 backdrop-blur-xl border border-ev-border/60 rounded-2xl p-8 shadow-[var(--ev-shadow-lg)]">
            {/* Loading State */}
            {status === 'loading' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-ev-accent/15 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-ev-accent animate-spin" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-ev-text-primary text-center mb-2">Loading…</h1>
              </>
            )}

            {/* Form State */}
            {status === 'form' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-ev-accent/15 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-ev-accent" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-ev-text-primary text-center mb-2">Reset your password</h1>
                <p className="text-ev-text-secondary text-center text-sm mb-6">
                  Enter a new password to regain access to your account.
                </p>

                {/* Error */}
                {formError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-ev-danger/15 border border-ev-danger/30 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-ev-danger flex-shrink-0" />
                    <p className="text-sm text-ev-danger">{formError}</p>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-ev-text-secondary">New Password</label>
                    <input
                      type="password"
                      placeholder="Enter a new password (min 8 characters)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={submitting}
                      className="w-full h-11 px-4 rounded-lg bg-[#0a0e14]/60 border border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus:border-ev-accent/60 focus:ring-1 focus:ring-[rgba(0,212,170,0.2)] outline-none transition-colors disabled:opacity-50"
                      required
                    />
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-ev-text-secondary">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm your new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={submitting}
                      className="w-full h-11 px-4 rounded-lg bg-[#0a0e14]/60 border border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus:border-ev-accent/60 focus:ring-1 focus:ring-[rgba(0,212,170,0.2)] outline-none transition-colors disabled:opacity-50"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/25 transition-all gap-2 disabled:opacity-60"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Resetting…
                      </>
                    ) : (
                      'Reset Password'
                    )}
                  </Button>
                </form>
              </>
            )}

            {/* Success State */}
            {status === 'success' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-ev-success/15 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-ev-success" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-ev-text-primary text-center mb-2">Password Reset!</h1>
                <p className="text-ev-text-secondary text-center text-sm mb-6">
                  Your password has been successfully reset. You can now sign in with your new password.
                </p>

                <Button
                  asChild
                  className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/25 transition-all"
                >
                  <Link to="/signin">Sign In</Link>
                </Button>
              </>
            )}

            {/* Error State */}
            {status === 'error' && (
              <>
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-ev-danger/15 flex items-center justify-center">
                    <XCircle className="w-8 h-8 text-ev-danger" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-ev-text-primary text-center mb-2">Reset Failed</h1>
                <p className="text-ev-text-secondary text-center text-sm mb-6">{errorMsg}</p>

                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/25 transition-all"
                  >
                    <Link to="/forgot-password">Request New Reset Link</Link>
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-ev-border hover:border-ev-accent/50"
                  >
                    <Link to="/signin">Back to Sign In</Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
