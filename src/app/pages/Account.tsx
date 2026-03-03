import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import {
  Camera,
  User,
  CreditCard,
  Receipt,
  Settings,
  LogOut,
  Mail,
  Shield,
  CalendarDays,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  Crown,
  Clock,
  Loader2,
  AlertCircle,
  Image,
  XCircle,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import {
  getUserPayments,
  type PaymentDocument,
} from '../lib/database.service';
import { checkSubscriptionAccess } from '../lib/subscription.service';
import { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Data is fetched from the backend in the component below           */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/*  Reusable card wrapper                                             */
/* ------------------------------------------------------------------ */
function DashboardCard({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay }}
      className="bg-ev-surface/60 backdrop-blur-xl border border-ev-border/50 rounded-2xl p-6 shadow-[var(--ev-shadow-md)] hover:border-ev-border-accent/40 transition-colors duration-300"
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-[var(--ev-radius-sm)] bg-gradient-to-br from-ev-accent/20 to-ev-cyan/10 flex items-center justify-center">
          <Icon className="w-[18px] h-[18px] text-ev-accent" />
        </div>
        <h2 className="text-lg font-semibold text-ev-text-primary">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helper: info row                                                  */
/* ------------------------------------------------------------------ */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-ev-border/30 last:border-0">
      <span className="text-sm text-ev-text-secondary">{label}</span>
      <span className="text-sm font-medium text-ev-text-primary">{value}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge                                                      */
/* ------------------------------------------------------------------ */
function StatusBadge({ status }: { status: string }) {
  const isPositive = ['active', 'paid'].includes(status.toLowerCase());
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
        isPositive
          ? 'bg-ev-success/15 text-ev-success'
          : 'bg-ev-warning/15 text-ev-warning'
      }`}
    >
      <CheckCircle2 className="w-3 h-3" />
      {status}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */
export default function Account() {
  const { user, signOut, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Authoritative access state from the backend function
  const [access, setAccess] = useState<{
    hasAccess: boolean;
    accountType: 'free' | 'paid';
    subscriptionStatus: string;
    planId: string | null;
    planName: string | null;
    expiresAt: string | null;
    watermarkEnabled: boolean;
  } | null>(null);

  const [payments, setPayments] = useState<PaymentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    Promise.all([
      checkSubscriptionAccess().then(setAccess),
      getUserPayments(user.id).then(setPayments).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isPaid = access?.accountType === 'paid';
  const formatDate = (iso: string | null) => {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen text-ev-text-primary flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00d4aa]/6 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-[#00bcd4]/6 rounded-full blur-3xl" />
      </div>

      {/* Header bar */}
      <div className="relative z-10 px-6 pt-8 pb-2 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center shadow-lg shadow-[rgba(0,212,170,0.3)] group-hover:shadow-[rgba(0,212,170,0.5)] transition-shadow">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-ev-text-primary">PhotoBooth Pro</span>
        </Link>

        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="text-ev-text-secondary hover:text-ev-danger hover:bg-ev-danger/10 transition-colors gap-2"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 w-full max-w-5xl mx-auto px-6 py-10">
        {/* Page heading */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-ev-text-primary mb-2">Account Dashboard</h1>
          <p className="text-ev-text-secondary">
            Manage your account, subscription, and billing details.
          </p>
        </motion.div>

        {/* Grid layout */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* ============ Account Details ============ */}
          <DashboardCard title="Account Details" icon={User} delay={0.05}>
            <div className="flex items-center gap-4 mb-5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center text-xl font-bold text-[#0a0e14] shadow-lg shadow-ev-accent/25">
                {user?.avatarInitial ?? 'U'}
              </div>
              <div>
                <p className="font-semibold text-ev-text-primary">{user?.name ?? 'User'}</p>
                <p className="text-sm text-ev-text-secondary flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {user?.email ?? 'user@example.com'}
                </p>
                {user && !user.emailVerified && (
                  <p className="text-xs text-ev-warning flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    Email not verified
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary text-xs gap-1.5 transition-all"
              >
                <Settings className="w-3.5 h-3.5" /> Edit Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary text-xs gap-1.5 transition-all"
              >
                <Shield className="w-3.5 h-3.5" /> Change Password
              </Button>
            </div>
          </DashboardCard>

          {/* ============ Subscription Details ============ */}
          <DashboardCard title="Subscription Details" icon={Crown} delay={0.1}>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-ev-text-muted" />
              </div>
            ) : isPaid ? (
              <div className="space-y-0">
                <div className="flex items-center justify-between py-2.5 border-b border-ev-border/30">
                  <span className="text-sm text-ev-text-secondary">Plan</span>
                  <span className="text-sm font-semibold text-ev-accent">{access!.planName}</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-ev-border/30">
                  <span className="text-sm text-ev-text-secondary">Account</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-ev-success/15 text-ev-success">
                    <CheckCircle2 className="w-3 h-3" />
                    Paid
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-ev-border/30">
                  <span className="text-sm text-ev-text-secondary">Status</span>
                  <StatusBadge status={access!.subscriptionStatus} />
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-ev-border/30">
                  <span className="text-sm text-ev-text-secondary flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5" /> Expires At
                  </span>
                  <span className="text-sm font-medium text-ev-text-primary">
                    {formatDate(access!.expiresAt)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-ev-text-secondary flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" /> Watermark
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-ev-success/15 text-ev-success">
                    <XCircle className="w-3 h-3" />
                    Disabled
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-0">
                <div className="flex items-center justify-between py-2.5 border-b border-ev-border/30">
                  <span className="text-sm text-ev-text-secondary">Plan</span>
                  <span className="text-sm font-medium text-ev-text-muted">Free Plan</span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-ev-border/30">
                  <span className="text-sm text-ev-text-secondary">Account</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-ev-warning/15 text-ev-warning">
                    <AlertCircle className="w-3 h-3" />
                    Free
                  </span>
                </div>
                <div className="flex items-center justify-between py-2.5 border-b border-ev-border/30">
                  <span className="text-sm text-ev-text-secondary flex items-center gap-1.5">
                    <Image className="w-3.5 h-3.5" /> Watermark
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-ev-warning/15 text-ev-warning">
                    <CheckCircle2 className="w-3 h-3" />
                    Enabled
                  </span>
                </div>
                <div className="pt-4 text-center">
                  <Button
                    asChild
                    size="sm"
                    className="bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/25 hover:shadow-ev-accent/40 text-xs gap-1.5"
                  >
                    <Link to="/pricing">
                      <ArrowUpRight className="w-3.5 h-3.5" /> Upgrade to Remove Watermark
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DashboardCard>

          {/* ============ Billing / Payment Method ============ */}
          <DashboardCard title="Billing / Payment Method" icon={CreditCard} delay={0.15}>
            <p className="text-sm text-ev-text-secondary mb-4">
              Payments are securely processed by Xendit. You can choose from bank transfers, e-wallets, credit cards, and other methods at checkout.
            </p>
            <div className="bg-[#0a0e14]/40 rounded-xl p-4 border border-ev-border/30 mb-4">
              <p className="text-sm text-ev-text-muted">
                Your payment method is selected each time you check out. No stored cards on file.
              </p>
            </div>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary text-xs gap-1.5 transition-all"
            >
              <Link to="/pricing">
                <CreditCard className="w-3.5 h-3.5" /> Purchase or Renew
              </Link>
            </Button>
          </DashboardCard>

          {/* ============ Manage Subscription ============ */}
          <DashboardCard title="Manage Subscription" icon={Settings} delay={0.2}>
            <p className="text-sm text-ev-text-secondary mb-5">
              Upgrade, downgrade, or manage your current subscription.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                asChild
                size="sm"
                className="bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/25 hover:shadow-ev-accent/40 text-xs gap-1.5 transition-all"
              >
                <Link to="/pricing">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Upgrade Plan
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary text-xs gap-1.5 transition-all"
              >
                <ChevronRight className="w-3.5 h-3.5" /> Downgrade
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-ev-border hover:border-ev-danger/50 bg-ev-surface/30 hover:bg-ev-danger/10 text-ev-text-primary hover:text-ev-danger text-xs gap-1.5 transition-all"
              >
                Cancel Subscription
              </Button>
            </div>
          </DashboardCard>

          {/* ============ Payment History (full width) ============ */}
          <div className="md:col-span-2">
            <DashboardCard title="Payment History" icon={Receipt} delay={0.25}>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-ev-text-muted" />
                </div>
              ) : (
                <>
                  {/* Table header */}
                  {payments.length > 0 && (
                    <div className="hidden sm:grid grid-cols-5 gap-4 text-xs font-medium text-ev-text-muted uppercase tracking-wider pb-3 border-b border-ev-border/40">
                      <span>Reference</span>
                      <span>Date</span>
                      <span>Plan</span>
                      <span className="text-right">Amount</span>
                      <span className="text-right">Status</span>
                    </div>
                  )}

                  {/* Rows */}
                  {payments.map((item) => {
                    const refId = item.providerPaymentId || item.$id;
                    return (
                      <div
                        key={item.$id}
                        className="grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 py-3.5 border-b border-ev-border/20 last:border-0 text-sm"
                      >
                        <span className="font-medium text-ev-text-primary text-xs sm:text-sm truncate" title={refId}>
                          {refId.length > 20 ? `…${refId.slice(-16)}` : refId}
                        </span>
                        <span className="text-ev-text-secondary flex items-center gap-1.5 text-xs sm:text-sm">
                          <Clock className="w-3.5 h-3.5 sm:hidden" />
                          {formatDate(item.paidAt || item.createdAt)}
                        </span>
                        <span className="text-ev-text-secondary text-xs sm:text-sm">{item.method || '—'}</span>
                        <span className="font-medium text-ev-text-primary sm:text-right text-xs sm:text-sm">
                          {item.currency === 'PHP' ? '₱' : item.currency}{(item.amount / 100).toLocaleString()}
                        </span>
                        <span className="sm:text-right">
                          <StatusBadge status={item.status} />
                        </span>
                      </div>
                    );
                  })}

                  {payments.length === 0 && (
                    <p className="text-center text-ev-text-muted py-8 text-sm">No payment history yet.</p>
                  )}
                </>
              )}
            </DashboardCard>
          </div>

          {/* ============ Sign Out (full width) ============ */}
          <div className="md:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.3 }}
              className="bg-ev-surface/40 backdrop-blur-xl border border-ev-border/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div>
                <h2 className="text-lg font-semibold text-ev-text-primary mb-1">Sign Out</h2>
                <p className="text-sm text-ev-text-secondary">
                  End your current session and return to the home page.
                </p>
              </div>
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="border-ev-danger/40 hover:border-ev-danger bg-ev-surface/30 hover:bg-ev-danger/10 text-ev-danger font-medium gap-2 transition-all shrink-0"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
