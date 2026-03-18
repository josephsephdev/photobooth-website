/**
 * VerifyEmail — callback page for email verification links.
 *
 * When the user clicks the verification link in their email,
 * Appwrite redirects them to: /verify-email?userId=xxx&secret=yyy
 *
 * This page reads those params, calls completeVerification, and shows the result.
 */

import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Camera, CheckCircle2, XCircle, Loader2, RotateCcw, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const { completeVerification, sendVerification } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [resending, setResending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  useEffect(() => {
    if (cooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCooldownSeconds((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownSeconds]);

  useEffect(() => {
    if (!resendSuccess) return;
    const timer = setTimeout(() => setResendSuccess(''), 5000);
    return () => clearTimeout(timer);
  }, [resendSuccess]);

  useEffect(() => {
    // HashRouter puts params in the hash query; also check window.location.search
    // as a fallback for when the URL hasn't been redirected yet.
    const fallbackParams = new URLSearchParams(window.location.search);
    const userId = searchParams.get('userId') || fallbackParams.get('userId');
    const secret = searchParams.get('secret') || fallbackParams.get('secret');

    if (!userId || !secret) {
      setErrorMsg('Invalid verification link. Missing userId or secret.');
      setStatus('error');
      return;
    }

    completeVerification(userId, secret)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setErrorMsg(err.message || 'Verification failed. The link may have expired.');
        setStatus('error');
      });
  }, [searchParams, completeVerification]);

  const handleResendVerification = async () => {
    if (resending || cooldownSeconds > 0) return;

    setResending(true);
    setResendError('');
    setResendSuccess('');

    try {
      await sendVerification();
      setResendSuccess('A new verification email has been sent.');
      setCooldownSeconds(60);
    } catch (err: any) {
      setResendError(
        err?.message ||
          'Unable to resend verification email. Please sign in and try again from the verification page.'
      );
    } finally {
      setResending(false);
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
          className="w-full max-w-md text-center"
        >
          <div className="bg-ev-surface/70 backdrop-blur-xl border border-ev-border/60 rounded-2xl p-10 shadow-[var(--ev-shadow-lg)]">
            {/* Loading */}
            {status === 'loading' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ev-accent/15 flex items-center justify-center">
                  <Loader2 className="w-10 h-10 text-ev-accent animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-ev-text-primary mb-2">Verifying your email…</h1>
                <p className="text-ev-text-secondary text-sm">Please wait a moment.</p>
              </>
            )}

            {/* Success */}
            {status === 'success' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ev-success/15 flex items-center justify-center">
                  <CheckCircle2 className="w-10 h-10 text-ev-success" />
                </div>
                <h1 className="text-2xl font-bold text-ev-text-primary mb-2">Email Verified!</h1>
                <p className="text-ev-text-secondary text-sm mb-6">
                  Your email has been successfully verified. You can now sign in to your account.
                </p>
                <div className="flex flex-col gap-3">
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300"
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
              </>
            )}

            {/* Error */}
            {status === 'error' && (
              <>
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ev-danger/15 flex items-center justify-center">
                  <XCircle className="w-10 h-10 text-ev-danger" />
                </div>
                <h1 className="text-2xl font-bold text-ev-text-primary mb-2">Verification Failed</h1>
                <p className="text-ev-text-secondary text-sm mb-6">{errorMsg}</p>

                {resendSuccess && (
                  <div className="mb-4 p-3 rounded-lg bg-ev-success/15 border border-ev-success/30 text-sm text-ev-success flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    {resendSuccess}
                  </div>
                )}

                {resendError && (
                  <div className="mb-4 p-3 rounded-lg bg-ev-danger/15 border border-ev-danger/30 text-sm text-ev-danger flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    {resendError}
                  </div>
                )}

                <div className="flex flex-col gap-3">
                  <Button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending || cooldownSeconds > 0}
                    variant="outline"
                    className="w-full border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary transition-all disabled:opacity-60"
                  >
                    <RotateCcw className={`w-4 h-4 mr-2 ${resending ? 'animate-spin' : ''}`} />
                    {resending
                      ? 'Resending…'
                      : cooldownSeconds > 0
                        ? `Resend in ${cooldownSeconds}s`
                        : 'Resend Verification Email'}
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300"
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
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
