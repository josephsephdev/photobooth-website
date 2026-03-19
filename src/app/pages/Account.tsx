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
  Crown,
  Clock,
  Loader2,
  AlertCircle,
  Image,
  XCircle,
  Trash2,
  Monitor,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { PaymentCountdown } from '../components/PaymentCountdown';
import { useAuth } from '../context/AuthContext';
import {
  getUserPayments,
  type PaymentDocument,
  isPaymentStale,
  getPaymentExpirationTime,
  getPaymentTimeRemaining,
} from '../lib/database.service';
import {
  checkSubscriptionAccess,
  cancelXenditPayment,
  cancelXenditSubscription,
} from '../lib/subscription.service';
import { getUserDevices, removeDevice, type DeviceDocument } from '../lib/device.service';
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
// PHASE 6: Enhanced status badge with more color variations
function StatusBadge({ status }: { status: string }) {
  const statusLower = status.toLowerCase();
  
  let bgColor = 'bg-ev-warning/15';
  let textColor = 'text-ev-warning';
  
  if (['paid', 'active'].includes(statusLower)) {
    bgColor = 'bg-ev-success/15';
    textColor = 'text-ev-success';
  } else if (['cancelled', 'expired'].includes(statusLower)) {
    bgColor = 'bg-ev-danger/15';
    textColor = 'text-ev-danger';
  } else if ('superseded' === statusLower) {
    bgColor = 'bg-ev-warning/15';
    textColor = 'text-ev-warning';
  }
  
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${bgColor} ${textColor}`}
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
  // PHASE 6: Track payment cancellation states
  const [cancellingPaymentId, setCancellingPaymentId] = useState<string | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [devices, setDevices] = useState<DeviceDocument[]>([]);
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);
  const [cancellingSubscription, setCancellingSubscription] = useState(false);
  const [subscriptionCancelError, setSubscriptionCancelError] = useState<string | null>(null);
  const [subscriptionCancelSuccess, setSubscriptionCancelSuccess] = useState<string | null>(null);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [changePasswordState, setChangePasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    loading: false,
    error: '',
    success: false,
  });

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    Promise.all([
      checkSubscriptionAccess().then(setAccess),
      getUserPayments(user.id).then(setPayments).catch(() => {}),
      getUserDevices(user.id).then(setDevices).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated, user]);

  // Refresh payments when user returns to the tab (webhook updates status server-side)
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const onFocus = () => {
      getUserPayments(user.id).then(setPayments).catch(() => {});
      getUserDevices(user.id).then(setDevices).catch(() => {});
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isAuthenticated, user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // PHASE 6: Handle payment cancellation
  const handleCancelPayment = async (paymentId: string) => {
    setCancellingPaymentId(paymentId);
    setCancelError(null);
    setCancelSuccess(null);

    try {
      const result = await cancelXenditPayment(paymentId);
      
      // Refresh payments list
      if (user) {
        const updated = await getUserPayments(user.id);
        setPayments(updated);
      }

      // Show success message briefly
      setCancelSuccess(`Payment cancelled successfully`);
      setTimeout(() => setCancelSuccess(null), 3000);
    } catch (err: any) {
      const message = err?.message || 'Failed to cancel payment';
      setCancelError(message);
      setTimeout(() => setCancelError(null), 5000);
      console.error('Cancel payment error:', err);
    } finally {
      setCancellingPaymentId(null);
    }
  };

  const isPaid = access?.accountType === 'paid';
  const isSubscriptionAlreadyCanceled = access?.subscriptionStatus?.toLowerCase() === 'canceled';

  const handleCancelSubscription = async () => {
    setSubscriptionCancelError(null);
    setSubscriptionCancelSuccess(null);
    setCancellingSubscription(true);

    try {
      const result = await cancelXenditSubscription();
      const refreshed = await checkSubscriptionAccess();
      setAccess(refreshed);

      const effectiveDate = formatDate(result.effectiveAt || refreshed.expiresAt);
      setSubscriptionCancelSuccess(
        `Cancellation scheduled. Your subscription stays active until ${effectiveDate}.`,
      );
    } catch (err: any) {
      const message = err?.message || 'Failed to cancel subscription';
      setSubscriptionCancelError(message);
    } finally {
      setCancellingSubscription(false);
    }
  };

  const handleRemoveDevice = async (deviceId: string) => {
    setRemovingDeviceId(deviceId);
    try {
      await removeDevice(deviceId);
      if (user) {
        const updated = await getUserDevices(user.id);
        setDevices(updated);
      }
    } catch (err: any) {
      console.error('Remove device error:', err);
    } finally {
      setRemovingDeviceId(null);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = changePasswordState;

    // Validation
    if (!currentPassword.trim()) {
      setChangePasswordState(prev => ({ ...prev, error: 'Current password is required' }));
      return;
    }
    if (!newPassword.trim()) {
      setChangePasswordState(prev => ({ ...prev, error: 'New password is required' }));
      return;
    }
    if (newPassword.length < 8) {
      setChangePasswordState(prev => ({ ...prev, error: 'New password must be at least 8 characters' }));
      return;
    }
    if (newPassword !== confirmPassword) {
      setChangePasswordState(prev => ({ ...prev, error: 'Passwords do not match' }));
      return;
    }

    setChangePasswordState(prev => ({ ...prev, loading: true, error: '', success: false }));

    try {
      const { changePassword: changePasswordFn } = await import('../lib/auth.service');
      await changePasswordFn(currentPassword, newPassword);
      
      setChangePasswordState(prev => ({
        ...prev,
        loading: false,
        success: true,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));

      // Close modal after 2 seconds
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setChangePasswordState(prev => ({ ...prev, success: false }));
      }, 2000);
    } catch (err: any) {
      const message = err?.message || 'Failed to change password';
      setChangePasswordState(prev => ({ ...prev, loading: false, error: message }));
    }
  };

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
          <span className="text-xl font-bold text-ev-text-primary">Luis&Co. Photobooth</span>
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
                onClick={() => setShowChangePasswordModal(true)}
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
              Upgrade or manage your current subscription.
            </p>
            {subscriptionCancelSuccess && (
              <div className="mb-4 p-3 bg-ev-success/15 border border-ev-success/30 rounded-lg text-sm text-ev-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                {subscriptionCancelSuccess}
              </div>
            )}
            {subscriptionCancelError && (
              <div className="mb-4 p-3 bg-ev-danger/15 border border-ev-danger/30 rounded-lg text-sm text-ev-danger flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {subscriptionCancelError}
              </div>
            )}
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
                className="border-ev-border hover:border-ev-danger/50 bg-ev-surface/30 hover:bg-ev-danger/10 text-ev-text-primary hover:text-ev-danger text-xs gap-1.5 transition-all"
                onClick={handleCancelSubscription}
                disabled={!isPaid || isSubscriptionAlreadyCanceled || cancellingSubscription || loading}
              >
                {cancellingSubscription ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Cancelling...
                  </>
                ) : isSubscriptionAlreadyCanceled ? (
                  'Cancellation Scheduled'
                ) : (
                  'Cancel Subscription'
                )}
              </Button>
            </div>
          </DashboardCard>

          {/* ============ Registered Devices ============ */}
          <div className="md:col-span-2">
            <DashboardCard title="Registered Devices" icon={Monitor} delay={0.22}>
              {loading ? (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-5 h-5 animate-spin text-ev-text-muted" />
                </div>
              ) : devices.length === 0 ? (
                <p className="text-center text-ev-text-muted py-6 text-sm">
                  No devices registered yet. Devices are registered when you sign in on the desktop app.
                </p>
              ) : (
                <div className="space-y-0">
                  {devices.map((device) => (
                    <div
                      key={device.$id}
                      className="flex items-center justify-between py-3 border-b border-ev-border/20 last:border-0"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-ev-surface-elevated/50 border border-ev-border/30 flex items-center justify-center flex-shrink-0">
                          <Monitor className="w-4 h-4 text-ev-accent" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ev-text-primary truncate">
                            {device.deviceName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-ev-text-muted">
                            <span className="px-1.5 py-0.5 rounded bg-ev-surface-elevated/50 border border-ev-border/30 uppercase">
                              {device.platform}
                            </span>
                            <span>
                              Last active: {device.lastActive ? formatDate(device.lastActive) : '—'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveDevice(device.deviceId)}
                        disabled={removingDeviceId === device.deviceId}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-ev-danger/15 text-ev-danger hover:bg-ev-danger/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0 ml-3"
                      >
                        {removingDeviceId === device.deviceId ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Trash2 className="w-3 h-3" />
                        )}
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          </div>

          {/* ============ Payment History (full width) ============ */}
          <div className="md:col-span-2">
            <DashboardCard title="Payment History" icon={Receipt} delay={0.25}>
              {cancelSuccess && (
                <div className="mb-4 p-3 bg-ev-success/15 border border-ev-success/30 rounded-lg text-sm text-ev-success flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  {cancelSuccess}
                </div>
              )}
              {cancelError && (
                <div className="mb-4 p-3 bg-ev-danger/15 border border-ev-danger/30 rounded-lg text-sm text-ev-danger flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {cancelError}
                </div>
              )}
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-ev-text-muted" />
                </div>
              ) : (
                <>
                  {/* Table header - PHASE 6: Added Actions column; Added Countdown column */}
                  {payments.length > 0 && (
                    <div className="hidden sm:grid grid-cols-7 gap-4 text-xs font-medium text-ev-text-muted uppercase tracking-wider pb-3 border-b border-ev-border/40">
                      <span>Reference</span>
                      <span>Date</span>
                      <span>Plan</span>
                      <span className="text-right">Amount</span>
                      <span className="text-right">Status</span>
                      <span className="text-center">Expires In</span>
                      <span className="text-center">Action</span>
                    </div>
                  )}

                  {/* Rows - PHASE 6: Added cancel button; Added countdown timer */}
                  {payments.map((item) => {
                    const refId = item.providerPaymentId || item.$id;
                    const canCancel = ['pending', 'superseded'].includes(item.status);
                    const isCancelling = cancellingPaymentId === item.$id;
                    
                    return (
                      <div
                        key={item.$id}
                        className="grid grid-cols-1 sm:grid-cols-7 gap-2 sm:gap-4 py-3.5 border-b border-ev-border/20 last:border-0 text-sm"
                      >
                        <span className="font-medium text-ev-text-primary text-xs sm:text-sm truncate" title={refId}>
                          {refId.length > 20 ? `…${refId.slice(-16)}` : refId}
                        </span>
                        <span className="text-ev-text-secondary flex items-center gap-1.5 text-xs sm:text-sm">
                          <Clock className="w-3.5 h-3.5 sm:hidden" />
                          {formatDate(item.paidAt || item.createdAt)}
                        </span>
                        <span className="text-ev-text-secondary text-xs sm:text-sm">{item.planId || '—'}</span>
                        <span className="font-medium text-ev-text-primary sm:text-right text-xs sm:text-sm">
                          {item.currency === 'PHP' ? '₱' : item.currency}{(item.amount / 100).toLocaleString()}
                        </span>
                        <span className="sm:text-right">
                          <StatusBadge status={item.status} />
                        </span>
                        <span className="sm:text-center">
                          <PaymentCountdown payment={item} />
                        </span>
                        <span className="text-center">
                          {canCancel ? (
                            <button
                              onClick={() => handleCancelPayment(item.$id)}
                              disabled={isCancelling}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-ev-danger/15 text-ev-danger hover:bg-ev-danger/25 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                            >
                              {isCancelling ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Cancelling
                                </>
                              ) : (
                                <>
                                  <Trash2 className="w-3 h-3" />
                                  Cancel
                                </>
                              )}
                            </button>
                          ) : (
                            <span className="text-ev-text-muted text-xs">—</span>
                          )}
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

      {/* ============ Change Password Modal ============ */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="w-full max-w-md bg-ev-surface/90 backdrop-blur-xl border border-ev-border/60 rounded-2xl p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-ev-text-primary">Change Password</h2>
              <button
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setChangePasswordState(prev => ({ ...prev, error: '', success: false }));
                }}
                className="text-ev-text-muted hover:text-ev-text-primary transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Success Message */}
            {changePasswordState.success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-ev-success/15 border border-ev-success/30 rounded-lg text-sm text-ev-success flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Password changed successfully!
              </motion.div>
            )}

            {/* Error Message */}
            {changePasswordState.error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-ev-danger/15 border border-ev-danger/30 rounded-lg text-sm text-ev-danger flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {changePasswordState.error}
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* Current Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ev-text-secondary">Current Password</label>
                <input
                  type="password"
                  placeholder="Enter your current password"
                  value={changePasswordState.currentPassword}
                  onChange={(e) =>
                    setChangePasswordState(prev => ({ ...prev, currentPassword: e.target.value }))
                  }
                  disabled={changePasswordState.loading}
                  className="w-full h-10 px-3 rounded-lg bg-[#0a0e14]/60 border border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus:border-ev-accent/60 focus:ring-1 focus:ring-[rgba(0,212,170,0.2)] outline-none transition-colors disabled:opacity-50"
                  required
                />
              </div>

              {/* New Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ev-text-secondary">New Password</label>
                <input
                  type="password"
                  placeholder="Enter a new password (min 8 characters)"
                  value={changePasswordState.newPassword}
                  onChange={(e) =>
                    setChangePasswordState(prev => ({ ...prev, newPassword: e.target.value }))
                  }
                  disabled={changePasswordState.loading}
                  className="w-full h-10 px-3 rounded-lg bg-[#0a0e14]/60 border border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus:border-ev-accent/60 focus:ring-1 focus:ring-[rgba(0,212,170,0.2)] outline-none transition-colors disabled:opacity-50"
                  required
                />
              </div>

              {/* Confirm New Password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-ev-text-secondary">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="Confirm your new password"
                  value={changePasswordState.confirmPassword}
                  onChange={(e) =>
                    setChangePasswordState(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  disabled={changePasswordState.loading}
                  className="w-full h-10 px-3 rounded-lg bg-[#0a0e14]/60 border border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus:border-ev-accent/60 focus:ring-1 focus:ring-[rgba(0,212,170,0.2)] outline-none transition-colors disabled:opacity-50"
                  required
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowChangePasswordModal(false);
                    setChangePasswordState(prev => ({ ...prev, error: '', success: false }));
                  }}
                  disabled={changePasswordState.loading}
                  className="flex-1 border-ev-border hover:border-ev-border text-ev-text-secondary"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={changePasswordState.loading}
                  className="flex-1 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold gap-2 disabled:opacity-60"
                >
                  {changePasswordState.loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating…
                    </>
                  ) : (
                    'Update Password'
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
