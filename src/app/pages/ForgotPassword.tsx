/**
 * ForgotPassword — page for users who forgot their password
 *
 * User enters their email and receives a password reset link via email.
 * They click the link to go to /reset-password with recovery secret.
 *
 * Features:
 *   - "Resend password reset link" button with 60s cooldown
 *   - Shows success/error states
 *   - Email preview on success
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Mail, ArrowLeft, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { requestPasswordReset } from '../lib/auth.service';

const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sent' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  // Resend state
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setCooldownSeconds(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Auto-clear resend success message after 5 seconds
  useEffect(() => {
    if (!resendSuccess) return;
    const timer = setTimeout(() => setResendSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [resendSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setStatus('idle');

    try {
      await requestPasswordReset(email);
      setStatus('sent');
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to send reset email. Please try again.');
      setStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleResendLink = async () => {
    setResendError('');
    setResendSuccess(false);

    try {
      await requestPasswordReset(email);
      setResendSuccess(true);
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend reset email. Please try again.');
    }
  };

  const isResendDisabled = cooldownSeconds > 0;
  const resendButtonText = 
    cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` :
    'Resend reset link';

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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-ev-surface/70 backdrop-blur-xl border border-ev-border/60 rounded-2xl p-8 shadow-[var(--ev-shadow-lg)]">
            {status === 'sent' ? (
              <>
                {/* Success State */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-ev-success/15 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-ev-success" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-ev-text-primary text-center mb-2">Check your email</h1>
                <p className="text-ev-text-secondary text-center text-sm mb-6">
                  We've sent a password reset link to <span className="text-ev-accent font-medium">{email}</span>. Click the link to reset your password.
                </p>

                <div className="bg-[#0a0e14]/40 rounded-lg p-4 mb-6 border border-ev-border/30">
                  <p className="text-xs text-ev-text-muted">
                    The reset link will expire in 15 minutes. If you don't see the email, check your spam folder.
                  </p>
                </div>

                {/* Resend Success */}
                {resendSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-lg bg-ev-success/15 border border-ev-success/30 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-ev-success flex-shrink-0" />
                    <p className="text-sm text-ev-success">Reset link sent successfully!</p>
                  </motion.div>
                )}

                {/* Resend Error */}
                {resendError && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-4 p-3 rounded-lg bg-ev-danger/15 border border-ev-danger/30 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-ev-danger flex-shrink-0" />
                    <p className="text-sm text-ev-danger">{resendError}</p>
                  </motion.div>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/25 transition-all"
                  >
                    <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                      <Mail className="w-4 h-4 mr-2" />
                      Open Gmail
                    </a>
                  </Button>

                  {/* Resend Button */}
                  <Button
                    onClick={handleResendLink}
                    disabled={isResendDisabled}
                    className="w-full bg-ev-surface/50 hover:bg-ev-surface border border-ev-border/60 hover:border-ev-accent/50 text-ev-text-primary font-semibold transition-all duration-300 disabled:opacity-60"
                  >
                    {cooldownSeconds > 0 ? (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {resendButtonText}
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4 mr-2" />
                        {resendButtonText}
                      </>
                    )}
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-ev-border hover:border-ev-accent/50"
                  >
                    <Link to="/signin" className="flex items-center justify-center gap-2">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </Link>
                  </Button>
                </div>
              </>
            ) : (
              <>
                {/* Form State */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-ev-accent/15 flex items-center justify-center">
                    <Mail className="w-8 h-8 text-ev-accent" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-ev-text-primary text-center mb-2">Reset your password</h1>
                <p className="text-ev-text-secondary text-center text-sm mb-6">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                {/* Error Message */}
                {status === 'error' && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-4 p-3 rounded-lg bg-ev-danger/15 border border-ev-danger/30 flex items-center gap-2"
                  >
                    <AlertCircle className="w-4 h-4 text-ev-danger flex-shrink-0" />
                    <p className="text-sm text-ev-danger">{errorMsg}</p>
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-ev-text-secondary">Email Address</label>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={loading}
                      className="w-full h-11 px-4 rounded-lg bg-[#0a0e14]/60 border border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus:border-ev-accent/60 focus:ring-1 focus:ring-[rgba(0,212,170,0.2)] outline-none transition-colors disabled:opacity-50"
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/25 transition-all gap-2 disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Send Reset Link'
                    )}
                  </Button>
                </form>

                {/* Back to Sign In */}
                <div className="mt-6 text-center">
                  <Button
                    asChild
                    variant="ghost"
                    className="text-ev-text-secondary hover:text-ev-text-primary gap-2"
                  >
                    <Link to="/signin">
                      <ArrowLeft className="w-4 h-4" />
                      Back to Sign In
                    </Link>
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
