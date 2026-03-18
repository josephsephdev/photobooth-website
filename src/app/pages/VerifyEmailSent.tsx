/**
 * VerifyEmailSent — shown immediately after signup.
 * Tells the user to check their email for a verification link.
 * User is NOT signed in at this point — they must verify first.
 *
 * Features:
 *   - "Open Gmail" button for quick access
 *   - "Resend verification email" button with cooldown (prevents spam)
 *   - Shows success/error states
 */

import { Link, useLocation } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Mail, ExternalLink, Check, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

const RESEND_COOLDOWN_SECONDS = 60; // Wait 60 seconds before allowing another resend

export default function VerifyEmailSent() {
  const location = useLocation();
  const email = (location.state as { email?: string })?.email;
  
  const { sendVerification } = useAuth();
  
  // Resend state
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState('');
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    
    const timer = setInterval(() => {
      setCooldownSeconds(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (!resendSuccess) return;
    const timer = setTimeout(() => setResendSuccess(false), 5000);
    return () => clearTimeout(timer);
  }, [resendSuccess]);

  const handleResendVerification = async () => {
    setIsResending(true);
    setResendError('');
    setResendSuccess(false);

    try {
      await sendVerification();
      setResendSuccess(true);
      setCooldownSeconds(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      setResendError(err.message || 'Failed to resend verification email. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const isResendDisabled = isResending || cooldownSeconds > 0;
  const resendButtonText = 
    isResending ? 'Sending…' :
    cooldownSeconds > 0 ? `Resend in ${cooldownSeconds}s` :
    'Resend verification email';

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
          className="w-full max-w-md text-center"
        >
          <div className="bg-ev-surface/70 backdrop-blur-xl border border-ev-border/60 rounded-2xl p-10 shadow-[var(--ev-shadow-lg)]">
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ev-accent/15 flex items-center justify-center">
              <Mail className="w-10 h-10 text-ev-accent" />
            </div>

            <h1 className="text-2xl font-bold text-ev-text-primary mb-2">
              Verify your email address
            </h1>
            <p className="text-ev-text-secondary text-sm mb-2">
              We've sent a verification link to:
            </p>
            {email && (
              <p className="text-ev-accent font-medium text-sm mb-6">{email}</p>
            )}
            <p className="text-ev-text-muted text-xs mb-6">
              Click the link in the email to verify your account. Once verified, you can sign in. If you don't see it, check your spam folder.
            </p>

            {/* Success Message */}
            {resendSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 p-3 rounded-lg bg-ev-success/15 border border-ev-success/30 flex items-center gap-2"
              >
                <Check className="w-4 h-4 text-ev-success flex-shrink-0" />
                <p className="text-sm text-ev-success">Verification email sent successfully!</p>
              </motion.div>
            )}

            {/* Error Message */}
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
                className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300 gap-2"
              >
                <a href="https://mail.google.com" target="_blank" rel="noopener noreferrer">
                  <Mail className="w-4 h-4" />
                  Open Gmail
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </Button>

              {/* Resend Button */}
              <Button
                onClick={handleResendVerification}
                disabled={isResendDisabled}
                className="w-full bg-ev-surface/50 hover:bg-ev-surface border border-ev-border/60 hover:border-ev-accent/50 text-ev-text-primary font-semibold transition-all duration-300 disabled:opacity-60"
              >
                {isResending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {resendButtonText}
                  </>
                ) : cooldownSeconds > 0 ? (
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
                className="w-full border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary transition-all"
              >
                <Link to="/signin">Sign In</Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full text-ev-text-secondary hover:text-ev-text-primary"
              >
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
