import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Footer } from '../components/Footer';

export default function RefundPolicy() {
  return (
    <div className="min-h-screen text-ev-text-primary flex flex-col">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00d4aa]/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00bcd4]/6 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-6 pt-8 flex items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center shadow-lg shadow-[rgba(0,212,170,0.3)]">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-ev-text-primary">Luis&Co. Photobooth</span>
        </Link>
        <Button asChild variant="ghost" className="text-ev-text-secondary hover:text-ev-text-primary">
          <Link to="/"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Home</Link>
        </Button>
      </div>

      {/* Content */}
      <div className="relative z-10 flex-1 max-w-4xl mx-auto px-6 py-16 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold text-ev-text-primary mb-4">Refund & Cancellation Policy</h1>
          <p className="text-ev-text-muted mb-12">Last updated: March 4, 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">1. Overview</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                This Refund & Cancellation Policy applies to all subscription plans and purchases made through <strong className="text-ev-text-primary">Luis&Co. Photobooth App</strong>, operated by <strong className="text-ev-text-primary">LUIS&CO. ONLINE SHOP</strong>, a DTI/BIR-registered business in the Philippines.
              </p>
              <p className="text-ev-text-secondary leading-relaxed">
                We want you to be satisfied with your purchase. Please read this policy carefully to understand your options for cancellation and refunds.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">2. Subscription Plans</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Luis&Co. Photobooth App offers the following subscription plans:
              </p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li><strong className="text-ev-text-primary">Event Pass (1 Day)</strong> — ₱150, one-time access for 24 hours.</li>
                <li><strong className="text-ev-text-primary">Pro Monthly (30 Days)</strong> — ₱700/month, recurring monthly subscription.</li>
                <li><strong className="text-ev-text-primary">Studio Annual (12 Months)</strong> — ₱7,000/year, recurring annual subscription.</li>
              </ul>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">3. Cancellation Policy</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                You may cancel your subscription at any time through your account settings on our website.
              </p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li><strong className="text-ev-text-primary">Monthly & Annual Subscriptions:</strong> When you cancel, your subscription will remain active until the end of the current billing period. You will not be charged for the next billing cycle.</li>
                <li><strong className="text-ev-text-primary">Event Pass:</strong> Since the Event Pass is a one-time purchase with a 24-hour access window, it cannot be cancelled once activated.</li>
              </ul>
              <p className="text-ev-text-secondary leading-relaxed">
                After cancellation, you will retain access to the app until your current subscription period expires. No further charges will be made.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">4. Refund Policy</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Because Luis&Co. Photobooth App is a digital product with instant access upon purchase, refunds are handled as follows:
              </p>
              <div className="space-y-4">
                <div className="pl-4 border-l-2 border-ev-accent/30">
                  <h3 className="text-lg font-semibold text-ev-text-primary mb-2">Event Pass (1-Day)</h3>
                  <p className="text-ev-text-secondary">No refunds are available for the Event Pass once it has been activated, as it provides immediate access to all features for a limited time.</p>
                </div>
                <div className="pl-4 border-l-2 border-ev-accent/30">
                  <h3 className="text-lg font-semibold text-ev-text-primary mb-2">Pro Monthly</h3>
                  <p className="text-ev-text-secondary">Refund requests for the monthly plan may be considered if submitted within 3 days of the initial purchase or renewal, provided the app has not been extensively used during that period. Refunds are reviewed on a case-by-case basis.</p>
                </div>
                <div className="pl-4 border-l-2 border-ev-accent/30">
                  <h3 className="text-lg font-semibold text-ev-text-primary mb-2">Studio Annual</h3>
                  <p className="text-ev-text-secondary">Refund requests for the annual plan may be considered if submitted within 7 days of the initial purchase, provided the app has not been extensively used during that period. Partial refunds for unused months are not available. Refunds are reviewed on a case-by-case basis.</p>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">5. How to Request a Refund</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                To request a refund, please contact our support team at <strong className="text-ev-accent">luiscophotobooth@gmail.com</strong> with the following information:
              </p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li>Your registered email address.</li>
                <li>The subscription plan purchased.</li>
                <li>The date of purchase.</li>
                <li>The reason for your refund request.</li>
              </ul>
              <p className="text-ev-text-secondary leading-relaxed">
                We will review your request and respond within 3–5 business days. If approved, the refund will be processed through the original payment method via Xendit.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">6. Payment Disputes</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                If you believe you have been charged in error, please contact us at <strong className="text-ev-accent">luiscophotobooth@gmail.com</strong> before initiating a dispute with your payment provider. We are committed to resolving billing issues promptly and fairly.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">7. Changes to This Policy</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                We may update this Refund & Cancellation Policy from time to time. Changes will be posted on this page with an updated "Last updated" date.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">8. Contact Us</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                For any questions about this policy or to request a refund, please contact us:
              </p>
              <div className="text-ev-text-secondary space-y-1">
                <p><strong className="text-ev-text-primary">Business Name:</strong> LUIS&CO. ONLINE SHOP</p>
                <p><strong className="text-ev-text-primary">Product:</strong> Luis&Co. Photobooth App</p>
                <p><strong className="text-ev-text-primary">Website:</strong> https://luiscophotobooth.app</p>
                <p><strong className="text-ev-text-primary">Email:</strong> <span className="text-ev-accent">luiscophotobooth@gmail.com</span></p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
