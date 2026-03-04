/**
 * VerifyEmailSent — shown immediately after signup.
 * Tells the user to check their email for a verification link.
 */

import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Mail, RefreshCw } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

export default function VerifyEmailSent() {
  const { user, sendVerification } = useAuth();
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await sendVerification();
      setResent(true);
    } catch {
      // Ignore — Appwrite may rate-limit
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
            {/* Icon */}
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ev-accent/15 flex items-center justify-center">
              <Mail className="w-10 h-10 text-ev-accent" />
            </div>

            <h1 className="text-2xl font-bold text-ev-text-primary mb-2">
              Check your email
            </h1>
            <p className="text-ev-text-secondary text-sm mb-2">
              We've sent a verification link to:
            </p>
            {user?.email && (
              <p className="text-ev-accent font-medium text-sm mb-6">{user.email}</p>
            )}
            <p className="text-ev-text-muted text-xs mb-6">
              Click the link in the email to verify your account. If you don't see it, check your spam folder.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={handleResend}
                disabled={resending || resent}
                variant="outline"
                className="w-full border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary transition-all gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
                {resent ? 'Email Sent!' : resending ? 'Sending…' : 'Resend Verification Email'}
              </Button>

              <Button
                asChild
                className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300"
              >
                <Link to="/account">Continue to Dashboard</Link>
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
