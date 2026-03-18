/**
 * RequestVerificationEmail — page for users who need to resend verification
 *
 * Use cases:
 *   - User forgot to verify and closed the VerifyEmailSent page
 *   - User tried to sign in and got "unverified email" error
 *   - User wants to request a new verification link
 *
 * Flow:
 *   1. User enters their email
 *   2. We sign them in with their email/password
 *   3. Check if they're unverified
 *   4. Send verification email
 *   5. Redirect to VerifyEmailSent
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { account } from '../lib/appwrite';
import { sendVerificationEmail } from '../lib/auth.service';

export default function RequestVerificationEmail() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email is required');
      return;
    }
    if (!password.trim()) {
      setError('Password is required');
      return;
    }

    setLoading(true);
    try {
      // Try to sign in with the provided credentials
      // If the user exists and is unverified, this will succeed and create a session
      await account.createEmailPasswordSession(email, password);

      // Get the user to check verification status
      const user = await account.get();
      
      if (!user.emailVerification) {
        // User is unverified, send verification email
        await sendVerificationEmail();
        
        // Redirect to VerifyEmailSent page
        navigate('/verify-email-sent', {
          state: { email },
        });
      } else {
        // User is already verified
        setError('Your email is already verified. You can now sign in.');
      }
    } catch (err: any) {
      // Handle various error cases
      if (err.code === 401 || err.message?.includes('Invalid credentials')) {
        setError('Invalid email or password. Please check and try again.');
      } else if (err.message?.includes('does not exist')) {
        setError('No account found with this email address. Please sign up first.');
      } else {
        setError(err.message || 'Failed to request verification email');
      }
    } finally {
      setLoading(false);
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          <div className="bg-ev-surface/70 backdrop-blur-xl border border-ev-border/60 rounded-2xl p-8 shadow-[var(--ev-shadow-lg)]">
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-ev-accent/15 flex items-center justify-center">
              <Mail className="w-8 h-8 text-ev-accent" />
            </div>

            {/* Title */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-ev-text-primary mb-2">Verify your email</h1>
              <p className="text-ev-text-secondary text-sm">
                Enter your credentials to request a new verification email
              </p>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-3 rounded-lg bg-ev-danger/15 border border-ev-danger/30 flex items-center gap-2"
              >
                <AlertCircle className="w-4 h-4 text-ev-danger flex-shrink-0" />
                <p className="text-sm text-ev-danger">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-ev-text-secondary">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-[#0a0e14]/60 border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus-visible:border-ev-accent/60 focus-visible:ring-[rgba(0,212,170,0.2)]"
                  required
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-ev-text-secondary">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="h-11 bg-[#0a0e14]/60 border-ev-border/60 text-ev-text-primary placeholder:text-ev-text-muted focus-visible:border-ev-accent/60 focus-visible:ring-[rgba(0,212,170,0.2)]"
                  required
                />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300 gap-2 disabled:opacity-60"
              >
                {loading ? 'Sending…' : 'Send Verification Email'}
                {!loading && <ArrowRight className="w-4 h-4" />}
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

            {/* Links */}
            <div className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary transition-all"
              >
                <Link to="/signin">Sign In to Your Account</Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                className="w-full text-ev-text-secondary hover:text-ev-text-primary"
              >
                <Link to="/signup">Create a New Account</Link>
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
