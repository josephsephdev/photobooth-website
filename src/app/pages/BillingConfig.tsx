import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Sparkles, ArrowLeft, Loader2, Minus, Plus, Monitor } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { createXenditCheckout } from '../lib/subscription.service';

// ── Plan config (mirrors backend PLANS — prices in centavos) ───────
const PLANS: Record<string, {
  id: string;
  name: string;
  price: number;
  currency: string;
  durationDays?: number;
  durationMinutes?: number;
  unitLabel: string;
  durationOptions: number[];
}> = {
  event_pass: {
    id: 'event_pass',
    name: 'Event Pass',
    price: 15000,
    currency: 'PHP',
    durationDays: 1,
    unitLabel: 'day',
    durationOptions: [1, 2, 3, 5, 7],
  },
  monthly: {
    id: 'monthly',
    name: 'Pro Monthly',
    price: 70000,
    currency: 'PHP',
    durationDays: 30,
    unitLabel: 'month',
    durationOptions: [1, 3, 6, 12],
  },
  yearly: {
    id: 'yearly',
    name: 'Studio Annual',
    price: 100,
    currency: 'PHP',
    durationDays: 365,
    unitLabel: 'year',
    durationOptions: [1, 2, 3],
  },
};

const MIN_DEVICES = 2;
const MAX_DEVICES = 10;
const EXTRA_DEVICE_RATE = 0.20;

function formatPhp(centavos: number): string {
  return `₱${(centavos / 100).toLocaleString()}`;
}

export default function BillingConfig() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const planId = searchParams.get('plan') || '';
  const plan = PLANS[planId];

  const [durationUnits, setDurationUnits] = useState(1);
  const [deviceLimit, setDeviceLimit] = useState(MIN_DEVICES);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect to pricing if plan is invalid
  if (!plan) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ev-text-primary">
        <div className="text-center">
          <p className="text-ev-text-secondary mb-4">Invalid plan selected.</p>
          <Button asChild>
            <Link to="/pricing">Back to Pricing</Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Price calculation ────────────────────────────────────────────
  const periodPrice = plan.price * durationUnits;
  const extraDevices = Math.max(0, deviceLimit - MIN_DEVICES);
  const deviceAddOn = Math.round(periodPrice * extraDevices * EXTRA_DEVICE_RATE);
  const total = periodPrice + deviceAddOn;

  const handleProceed = async () => {
    setError('');

    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    setLoading(true);
    try {
      const { checkoutUrl } = await createXenditCheckout(planId, durationUnits, deviceLimit);
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err.message || 'Could not start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-ev-text-primary flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00d4aa]/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00bcd4]/6 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center shadow-lg shadow-[rgba(0,212,170,0.3)] group-hover:shadow-[rgba(0,212,170,0.5)] transition-shadow">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-ev-text-primary">Luis&Co. Photobooth</span>
        </Link>
        <Button
          asChild
          variant="ghost"
          className="text-ev-text-secondary hover:text-ev-accent gap-2"
        >
          <Link to="/pricing">
            <ArrowLeft className="w-4 h-4" /> Back to Plans
          </Link>
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-lg"
        >
          {/* Title */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-ev-accent text-sm font-medium mb-4">
              <Sparkles className="w-4 h-4" />
              Configure Your Plan
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-ev-text-primary mb-2">
              {plan.name}
            </h1>
            <p className="text-ev-text-secondary">
              Customize your subscription duration and device limit.
            </p>
          </div>

          {/* Config card */}
          <div className="bg-ev-surface/60 backdrop-blur-xl border border-ev-border/50 rounded-2xl p-6 shadow-[var(--ev-shadow-md)] space-y-6">
            {/* Duration picker */}
            <div>
              <label className="block text-sm font-medium text-ev-text-primary mb-3">
                Duration
              </label>
              <div className="flex flex-wrap gap-2">
                {plan.durationOptions.map((opt) => {
                  const isSelected = durationUnits === opt;
                  const label = `${opt} ${plan.unitLabel}${opt > 1 ? 's' : ''}`;
                  return (
                    <button
                      key={opt}
                      onClick={() => setDurationUnits(opt)}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? 'bg-gradient-to-r from-ev-accent to-ev-cyan text-[#0a0e14] shadow-lg shadow-[rgba(0,212,170,0.25)]'
                          : 'bg-ev-surface-elevated/40 border border-ev-border/50 text-ev-text-secondary hover:border-ev-accent/50 hover:text-ev-text-primary'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Device stepper */}
            <div>
              <label className="block text-sm font-medium text-ev-text-primary mb-1">
                Devices
              </label>
              <p className="text-xs text-ev-text-muted mb-3">
                2 devices included. Each extra device adds 20% to the base price.
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDeviceLimit(Math.max(MIN_DEVICES, deviceLimit - 1))}
                  disabled={deviceLimit <= MIN_DEVICES}
                  className="w-10 h-10 rounded-xl bg-ev-surface-elevated/40 border border-ev-border/50 flex items-center justify-center text-ev-text-secondary hover:border-ev-accent/50 hover:text-ev-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-2 px-5 py-2 rounded-xl bg-ev-surface-elevated/40 border border-ev-border/50 min-w-[80px] justify-center">
                  <Monitor className="w-4 h-4 text-ev-accent" />
                  <span className="text-lg font-semibold text-ev-text-primary">{deviceLimit}</span>
                </div>
                <button
                  onClick={() => setDeviceLimit(Math.min(MAX_DEVICES, deviceLimit + 1))}
                  disabled={deviceLimit >= MAX_DEVICES}
                  className="w-10 h-10 rounded-xl bg-ev-surface-elevated/40 border border-ev-border/50 flex items-center justify-center text-ev-text-secondary hover:border-ev-accent/50 hover:text-ev-accent transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-ev-border/30" />

            {/* Price breakdown */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-ev-text-secondary">
                  Base ({plan.name} × {durationUnits} {plan.unitLabel}{durationUnits > 1 ? 's' : ''})
                </span>
                <span className="font-medium text-ev-text-primary">{formatPhp(periodPrice)}</span>
              </div>

              {extraDevices > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ev-text-secondary">
                    Device add-on (+{extraDevices} device{extraDevices > 1 ? 's' : ''} × 20%)
                  </span>
                  <span className="font-medium text-ev-accent">+{formatPhp(deviceAddOn)}</span>
                </div>
              )}

              <div className="border-t border-ev-border/30 pt-3 flex items-center justify-between">
                <span className="text-base font-semibold text-ev-text-primary">Total</span>
                <span className="text-2xl font-bold bg-gradient-to-r from-ev-accent to-ev-cyan bg-clip-text text-transparent">
                  {formatPhp(total)}
                </span>
              </div>
            </div>

            {/* Proceed button */}
            <Button
              onClick={handleProceed}
              disabled={loading}
              className="w-full h-12 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300 text-sm disabled:opacity-60"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Processing…
                </span>
              ) : (
                'Proceed to Payment'
              )}
            </Button>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center text-sm text-ev-danger bg-ev-danger/10 border border-ev-danger/20 rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}
          </div>

          {/* Footer note */}
          <p className="text-center text-ev-text-muted text-sm mt-6">
            Payments processed securely via Xendit. You'll be redirected to complete payment.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
