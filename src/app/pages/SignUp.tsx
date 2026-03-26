import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Eye, EyeOff, Mail, Lock, UserIcon, LogIn } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../context/AuthContext';
import { createDesktopAuthCode } from '../lib/desktop-auth.service';
import { sanitizeUserName, sanitizeEmail } from '../lib/sanitize';
import { checkPasswordStrength, getStrengthDisplay } from '../lib/password.service';

export default function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [agreedToTOS, setAgreedToTOS] = useState(false);
  const [showTOSModal, setShowTOSModal] = useState(false);
  const [showPPModal, setShowPPModal] = useState(false);
  const { signUp, signOut, isAuthenticated, user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get password strength info
  const passwordStrength = checkPasswordStrength(password);

  // Desktop app redirect params
  const source = searchParams.get('source');
  const redirect = searchParams.get('redirect');
  const isDesktop = source === 'desktop' && !!redirect;

  // Preserve desktop params for cross-page links
  const desktopParams = isDesktop
    ? `?source=desktop&redirect=${encodeURIComponent(redirect!)}`
    : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // ── Client-side validation ──
    if (!fullName.trim()) {
      setError('Username is required');
      return;
    }
    if (!agreedToTOS) {
      setError('You must agree to the Terms of Service and Privacy Policy');
      return;
    }
    if (!passwordStrength.isValid) {
      setError('Password does not meet all requirements');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      // If there's already an active session, sign out first
      // (This handles both verified AND unverified sessions)
      if (isAuthenticated) {
        await signOut();
      }
      
      await signUp(email, password, fullName.trim());

      // ── Desktop app callback ──────────────────────────────────
      if (isDesktop) {
        try {
          const code = await createDesktopAuthCode();
          if (code) {
            // Redirect back to the desktop app with the one-time code
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
      // Appwrite error messages are in err.message
      setError(err.message || 'Sign up failed');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Continue as the currently-signed-in user (desktop flow).
   */
  const handleContinueAsUser = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (isDesktop) {
        const code = await createDesktopAuthCode();
        if (code) {
          window.location.href = `${redirect}?code=${encodeURIComponent(code)}`;
          return;
        }
      }
      navigate('/account');
    } catch (err: any) {
      setError(err.message || 'Failed to continue');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Sign out current session so user can create a new account.
   */
  const handleUseDifferentAccount = async () => {
    setError('');
    try {
      await signOut();
    } catch (err: any) {
      console.error('Sign out error:', err);
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
          <span className="text-xl font-bold text-ev-text-primary">Luis&Co. Photobooth</span>
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

            {/* ── "Continue as" banner when user already has a session ── */}
            {!loading && isAuthenticated && user && (
              <div className="mb-6 p-4 rounded-xl bg-[#0a0e14]/60 border border-ev-border/60">
                <p className="text-sm text-ev-text-secondary mb-3">
                  You're already signed in as:
                </p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center text-[#0a0e14] font-bold text-lg">
                    {user.avatarInitial}
                  </div>
                  <div>
                    <p className="font-semibold text-ev-text-primary text-sm">{sanitizeUserName(user.name)}</p>
                    <p className="text-ev-text-muted text-xs">{sanitizeEmail(user.email)}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    onClick={handleContinueAsUser}
                    disabled={submitting}
                    className="w-full h-10 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] transition-all duration-300 disabled:opacity-60"
                  >
                    <LogIn className="w-4 h-4 mr-2" />
                    {submitting ? 'Connecting…' : `Continue as ${sanitizeUserName(user.name)}`}
                  </Button>
                  <button
                    type="button"
                    onClick={handleUseDifferentAccount}
                    className="text-sm text-ev-text-muted hover:text-ev-accent transition-colors"
                  >
                    Use a different account
                  </button>
                </div>
                {error && <p className="text-xs text-ev-danger mt-2">{error}</p>}
              </div>
            )}

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-ev-text-primary mb-2">Create your account</h1>
              <p className="text-ev-text-secondary text-sm">Get started with Luis&Co. Photobooth</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-ev-text-secondary">Username</Label>
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

                {/* Password Strength Indicator */}
                {password && (
                  <div className="mt-3 space-y-2">
                    {/* Strength Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-ev-text-muted">Password strength:</span>
                        <span className={`text-xs font-semibold ${getStrengthDisplay(passwordStrength.strength).color}`}>
                          {getStrengthDisplay(passwordStrength.strength).label}
                        </span>
                      </div>
                      <div className="h-1.5 bg-ev-background rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${getStrengthDisplay(passwordStrength.strength).barColor}`}
                          style={{ width: `${(passwordStrength.score / 4) * 100}%` }}
                        />
                      </div>
                    </div>

                    {/* Requirements Checklist */}
                    <div className="space-y-1.5 pt-1">
                      <div
                        className={`flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md ${
                          passwordStrength.requirements.minLength
                            ? 'bg-ev-success/10 text-ev-success'
                            : 'bg-ev-surface/30 text-ev-text-muted'
                        }`}
                      >
                        <span className={passwordStrength.requirements.minLength ? '✓' : '○'}>
                          {passwordStrength.requirements.minLength ? '✓' : '○'}
                        </span>
                        At least 8 characters
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md ${
                          passwordStrength.requirements.uppercase
                            ? 'bg-ev-success/10 text-ev-success'
                            : 'bg-ev-surface/30 text-ev-text-muted'
                        }`}
                      >
                        <span>{passwordStrength.requirements.uppercase ? '✓' : '○'}</span>
                        One uppercase letter (A-Z)
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md ${
                          passwordStrength.requirements.number
                            ? 'bg-ev-success/10 text-ev-success'
                            : 'bg-ev-surface/30 text-ev-text-muted'
                        }`}
                      >
                        <span>{passwordStrength.requirements.number ? '✓' : '○'}</span>
                        One number (0-9)
                      </div>

                      <div
                        className={`flex items-center gap-2 text-xs py-1.5 px-2.5 rounded-md ${
                          passwordStrength.requirements.specialChar
                            ? 'bg-ev-success/10 text-ev-success'
                            : 'bg-ev-surface/30 text-ev-text-muted'
                        }`}
                      >
                        <span>{passwordStrength.requirements.specialChar ? '✓' : '○'}</span>
                        One special character (!@#$%^&*)
                      </div>
                    </div>
                  </div>
                )}
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

              {/* Terms of Service & Privacy Policy Checkbox */}
              <div className="space-y-3 py-3">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="tos-checkbox"
                    checked={agreedToTOS}
                    onChange={(e) => setAgreedToTOS(e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-ev-border/60 bg-[#0a0e14]/60 accent-ev-accent cursor-pointer"
                  />
                  <label htmlFor="tos-checkbox" className="text-sm text-ev-text-secondary cursor-pointer flex-1">
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => setShowTOSModal(true)}
                      className="text-ev-accent hover:text-ev-accent-hover font-medium underline transition-colors"
                    >
                      Terms of Service
                    </button>
                    {' '}and{' '}
                    <button
                      type="button"
                      onClick={() => setShowPPModal(true)}
                      className="text-ev-accent hover:text-ev-accent-hover font-medium underline transition-colors"
                    >
                      Privacy Policy
                    </button>
                  </label>
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
          </div>

          {/* Terms of Service Modal */}
          {showTOSModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-ev-surface/95 backdrop-blur-xl border border-ev-border/60 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-ev-border/60">
                  <h2 className="text-xl font-bold text-ev-text-primary">Terms of Service</h2>
                  <button
                    type="button"
                    onClick={() => setShowTOSModal(false)}
                    className="text-ev-text-muted hover:text-ev-text-primary transition-colors p-1"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-ev-text-secondary text-sm">
                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">1. Acceptance of Terms</h3>
                    <p>By using the <strong className="text-ev-text-primary">Luis&Co. Photobooth</strong> application (accessible at luiscophotobooth.app and via desktop download), you agree to these Terms of Service. If you do not agree to these terms, please do not use our application.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">2. Service Description</h3>
                    <p>Luis&Co. Photobooth provides professional software for capturing photos and videos at events, including weddings, parties, corporate events, and more. The application includes optional features to:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li>Capture and process high-quality photos and videos</li>
                      <li>Apply filters, watermarks, and effects to your media</li>
                      <li>Connect to your Google Drive for cloud storage and sharing</li>
                      <li>Manage subscriptions and access premium features</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">3. User Responsibilities</h3>
                    <p>As a user of Luis&Co. Photobooth, you are responsible for:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li>All content captured and stored through the application</li>
                      <li>Complying with all local privacy laws and regulations when photographing guests at events</li>
                      <li>Obtaining proper consent from all individuals whose photos or videos are captured</li>
                      <li>Securing your login credentials and account information</li>
                      <li>Maintaining appropriate use of the application and its features</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">4. Third-Party Services</h3>
                    <p>Luis&Co. Photobooth integrates with third-party services, including but not limited to:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li><strong className="text-ev-text-primary">Google Drive:</strong> For cloud storage and file sharing</li>
                      <li><strong className="text-ev-text-primary">Xendit:</strong> For payment processing and subscriptions</li>
                      <li><strong className="text-ev-text-primary">Appwrite:</strong> For backend services and data management</li>
                    </ul>
                    <p className="mt-3">By using these features, you agree to be bound by the Terms of Service and Privacy Policies of these third-party providers. We are not responsible for service interruptions, data loss, or any issues arising from these external platforms.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">5. Limitation of Liability</h3>
                    <p>Luis&Co. Photobooth is provided <strong className="text-ev-text-primary">"as is"</strong> without any warranties, express or implied. We are not liable for:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li>Loss of data or corrupted files during an event</li>
                      <li>Hardware failures or system crashes</li>
                      <li>Internet connectivity issues</li>
                      <li>Third-party service interruptions or failures</li>
                      <li>Any indirect, incidental, or consequential damages</li>
                    </ul>
                    <p className="mt-3">It is your responsibility to back up important files and use the application on reliable hardware.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">6. Subscription and Payment</h3>
                    <p>Users may subscribe to premium features through our payment processor. All subscription payments are subject to our Refund & Cancellation Policy. By subscribing, you authorize recurring charges until you cancel your subscription.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">7. Prohibited Uses</h3>
                    <p>You agree not to use Luis&Co. Photobooth for:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li>Illegal or harmful activities</li>
                      <li>Capturing or distributing content without proper consent</li>
                      <li>Reverse engineering or attempting to access source code</li>
                      <li>Circumventing subscription protections or payment requirements</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">8. Changes to Terms</h3>
                    <p>We reserve the right to update these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of the application after changes constitutes acceptance of the new terms.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">9. Contact Us</h3>
                    <p><strong className="text-ev-text-primary">Email:</strong> luiscophotobooth@gmail.com</p>
                    <p className="mt-2"><strong className="text-ev-text-primary">Business:</strong> LUIS&CO. ONLINE SHOP (DTI/BIR-Registered)</p>
                  </section>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-ev-border/60 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTOSModal(false)}
                    className="px-4 py-2 rounded-lg bg-ev-accent/20 text-ev-accent hover:bg-ev-accent/30 transition-colors font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}

          {/* Privacy Policy Modal */}
          {showPPModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="bg-ev-surface/95 backdrop-blur-xl border border-ev-border/60 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-ev-border/60">
                  <h2 className="text-xl font-bold text-ev-text-primary">Privacy Policy</h2>
                  <button
                    type="button"
                    onClick={() => setShowPPModal(false)}
                    className="text-ev-text-muted hover:text-ev-text-primary transition-colors p-1"
                    aria-label="Close"
                  >
                    ✕
                  </button>
                </div>

                {/* Modal Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-ev-text-secondary text-sm">
                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">1. Introduction</h3>
                    <p>This Privacy Policy describes how <strong className="text-ev-text-primary">LUIS&CO. ONLINE SHOP</strong> ("we," "us," or "our"), the operator of <strong className="text-ev-text-primary">Luis&Co. Photobooth App</strong> (accessible at luiscophotobooth.app), collects, uses, and protects your personal information when you use our website, desktop application, and subscription services.</p>
                    <p className="mt-2">LUIS&CO. ONLINE SHOP is a DTI/BIR-registered business in the Philippines offering digital products, apps, and subscriptions.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">2. Information We Collect</h3>
                    <p>We may collect the following types of information:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li><strong className="text-ev-text-primary">Account Information:</strong> Name, email address, and password when you create an account.</li>
                      <li><strong className="text-ev-text-primary">Billing Information:</strong> Payment details processed securely through our payment provider, Xendit. We do not store your full credit card or payment account numbers on our servers.</li>
                      <li><strong className="text-ev-text-primary">Usage Data:</strong> Information about how you use the application, including features accessed, session duration, and technical data such as device type and operating system version.</li>
                      <li><strong className="text-ev-text-primary">Support Communications:</strong> Messages, emails, or inquiries you send to our support team.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">3. How We Use Your Information</h3>
                    <p>We use the collected information to:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li>Provide, maintain, and improve our application and services.</li>
                      <li>Process subscription payments and manage your account.</li>
                      <li>Send important notifications about your account, subscription status, or service updates.</li>
                      <li>Respond to your support requests and inquiries.</li>
                      <li>Ensure security, prevent fraud, and protect our users.</li>
                      <li>Comply with legal obligations.</li>
                    </ul>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">4. Data Sharing & Third Parties</h3>
                    <p>We do not sell your personal information. We may share limited data with trusted third-party service providers who help us operate our business:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li><strong className="text-ev-text-primary">Xendit</strong> — for secure payment processing.</li>
                      <li><strong className="text-ev-text-primary">Appwrite</strong> — for authentication and cloud database services.</li>
                      <li><strong className="text-ev-text-primary">Google Drive</strong> — for optional cloud photo backup (user-initiated).</li>
                    </ul>
                    <p className="mt-3">These providers are contractually obligated to protect your information and may only use it in connection with the services they provide to us.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">5. How We Use Google User Data</h3>
                    <p><strong className="text-ev-text-primary">LuisCo Photobooth</strong> accesses your Google Drive to provide cloud storage and sharing features for your photobooth events.</p>
                    <div className="mt-2 space-y-2">
                      <div>
                        <h4 className="font-semibold text-ev-text-primary mb-1">Data Access</h4>
                        <p>Our app requests the drive.file scope. This allows us to create a dedicated folder (e.g., "[Event Name]") on your Google Drive and upload only the photos and videos captured during your event sessions.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-ev-text-primary mb-1">Data Storage & Sharing</h4>
                        <p>Photos are stored directly on your personal Google Drive. To enable guest sharing via QR code, our app generates a public sharing link for these specific files/folders as instructed by you.</p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-ev-accent mb-1">Limited Use Disclosure</h4>
                        <p><strong>LuisCo Photobooth's use and transfer of information received from Google APIs to any other app will adhere to Google API Services User Data Policy, including the Limited Use requirements.</strong></p>
                      </div>
                      <div>
                        <h4 className="font-semibold text-ev-text-primary mb-1">Data Retention</h4>
                        <p>We do not store your Google credentials or files on our own servers. Your data remains in your Google Drive and is governed by your own Google account settings.</p>
                      </div>
                    </div>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">6. Data Security</h3>
                    <p>We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">7. Your Rights</h3>
                    <p>You have the right to:</p>
                    <ul className="list-disc list-inside ml-2 mt-2 space-y-1">
                      <li>Access and review the personal information we hold about you.</li>
                      <li>Request correction of inaccurate information.</li>
                      <li>Request deletion of your account and associated data.</li>
                      <li>Opt out of non-essential communications.</li>
                    </ul>
                    <p className="mt-3">To exercise any of these rights, please contact us at <strong className="text-ev-accent">luiscophotobooth@gmail.com</strong>.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">8. Cookies & Tracking</h3>
                    <p>Our website may use cookies and similar technologies to improve your browsing experience, analyze site traffic, and understand usage patterns. You can control cookie preferences through your browser settings.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">9. Children's Privacy</h3>
                    <p>Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without appropriate consent, we will take steps to delete that information.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">10. Changes to This Policy</h3>
                    <p>We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this page periodically for any changes.</p>
                  </section>

                  <section>
                    <h3 className="text-lg font-semibold text-ev-text-primary mb-2">11. Contact Us</h3>
                    <p>If you have any questions about this Privacy Policy, please contact us:</p>
                    <div className="mt-2 space-y-1">
                      <p><strong className="text-ev-text-primary">Business Name:</strong> LUIS&CO. ONLINE SHOP</p>
                      <p><strong className="text-ev-text-primary">Product:</strong> Luis&Co. Photobooth App</p>
                      <p><strong className="text-ev-text-primary">Website:</strong> https://luiscophotobooth.app</p>
                      <p><strong className="text-ev-text-primary">Email:</strong> <span className="text-ev-accent">luiscophotobooth@gmail.com</span></p>
                    </div>
                  </section>
                </div>

                {/* Modal Footer */}
                <div className="border-t border-ev-border/60 px-6 py-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowPPModal(false)}
                    className="px-4 py-2 rounded-lg bg-ev-accent/20 text-ev-accent hover:bg-ev-accent/30 transition-colors font-medium text-sm"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
