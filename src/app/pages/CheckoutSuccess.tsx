import { Link, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Camera, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { getActiveSubscription } from '../lib/database.service';
import { useEffect, useState } from 'react';

export default function CheckoutSuccess() {
  const { isAuthenticated, user } = useAuth();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get('ref');
  const [subStatus, setSubStatus] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  // Poll Appwrite for subscription activation (webhook may take a moment)
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    let attempts = 0;
    const maxAttempts = 20; // poll for up to ~40 seconds

    const interval = setInterval(async () => {
      attempts++;
      try {
        const sub = await getActiveSubscription(user.id);
        if (sub && sub.status === 'active') {
          setSubStatus('active');
          setPolling(false);
          clearInterval(interval);
        }
      } catch {
        // ignore — keep polling
      }
      if (attempts >= maxAttempts) {
        setPolling(false);
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

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
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-ev-success/15 flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-ev-success" />
            </div>

            <h1 className="text-2xl font-bold text-ev-text-primary mb-2">
              Payment Successful!
            </h1>
            <p className="text-ev-text-secondary text-sm mb-6">
              Thank you for your purchase. Your subscription is being activated.
            </p>

            {/* Status indicator */}
            {polling ? (
              <div className="flex items-center justify-center gap-2 text-sm text-ev-text-muted mb-6">
                <div className="w-4 h-4 border-2 border-ev-accent border-t-transparent rounded-full animate-spin" />
                Confirming payment…
              </div>
            ) : subStatus === 'active' ? (
              <div className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-full bg-ev-success/15 text-ev-success mb-6">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Subscription Active
              </div>
            ) : (
              <p className="text-xs text-ev-text-muted mb-6">
                If your subscription isn't showing yet, it may take a moment to process.
              </p>
            )}

            {ref && (
              <p className="text-xs text-ev-text-muted mb-6 break-all">
                Reference: {ref}
              </p>
            )}

            <div className="flex flex-col gap-3">
              <Button
                asChild
                className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300"
              >
                <Link to="/account">
                  Go to Account Dashboard
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary transition-all"
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
