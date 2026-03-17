import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Footer } from '../components/Footer';

export default function TermsAndConditions() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-ev-text-primary mb-4">Terms and Conditions</h1>
          <p className="text-ev-text-muted mb-12">Last updated: March 4, 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">1. Introduction</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                These Terms and Conditions ("Terms") govern your use of the <strong className="text-ev-text-primary">Luis&Co. Photobooth App</strong> website, desktop application, and subscription services (collectively, the "Service") operated by <strong className="text-ev-text-primary">LUIS&CO. ONLINE SHOP</strong> ("we," "us," or "our"), a DTI/BIR-registered business in the Philippines.
              </p>
              <p className="text-ev-text-secondary leading-relaxed">
                By accessing or using the Service, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use the Service.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">2. Description of Service</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Luis&Co. Photobooth App is a professional desktop photobooth application available for download. The Service includes:
              </p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li>A downloadable desktop application for Windows.</li>
                <li>Subscription-based access plans (Event Pass, Pro Monthly, Studio Annual).</li>
                <li>Cloud-based features and regular software updates.</li>
                <li>Customer support via email.</li>
              </ul>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">3. Account Registration</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                To use the full features of the Service, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li>Providing accurate and complete registration information.</li>
                <li>Maintaining the security and confidentiality of your account credentials.</li>
                <li>All activity that occurs under your account.</li>
              </ul>
              <p className="text-ev-text-secondary leading-relaxed">
                You must be at least 18 years of age (or the age of majority in your jurisdiction) to create an account and use the Service.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">4. Subscription Plans & Payments</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                The Service offers multiple subscription plans with different durations and pricing. By subscribing to a plan:
              </p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li>You agree to pay the applicable fees as displayed on our pricing page at the time of purchase.</li>
                <li>All payments are processed securely through <strong className="text-ev-text-primary">Xendit</strong>, a trusted third-party payment provider.</li>
                <li>Prices are listed in Philippine Pesos (₱) and may be subject to change with prior notice.</li>
                <li>Recurring subscriptions (monthly and annual) will automatically renew unless cancelled before the renewal date.</li>
              </ul>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">5. License & Usage Rights</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Upon subscribing to a plan, we grant you a limited, non-exclusive, non-transferable, revocable license to use the Luis&Co. Photobooth App for the duration of your active subscription. You may not:
              </p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li>Redistribute, sublicense, resell, or share your subscription access with others.</li>
                <li>Reverse-engineer, decompile, or modify the application.</li>
                <li>Use the application for any unlawful purpose.</li>
                <li>Attempt to circumvent any subscription or licensing mechanisms.</li>
              </ul>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">6. Cancellation & Refunds</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                You may cancel your subscription at any time through your account settings. For details on our refund and cancellation policies, please refer to our{' '}
                <Link to="/refund-policy" className="text-ev-accent hover:text-ev-accent-hover transition-colors">
                  Refund & Cancellation Policy
                </Link>.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">7. Intellectual Property</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                All content, software, design, trademarks, and intellectual property associated with Luis&Co. Photobooth App are owned by LUIS&CO. ONLINE SHOP. Your subscription does not transfer any ownership rights to you.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">8. Limitation of Liability</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                To the maximum extent permitted by applicable law, LUIS&CO. ONLINE SHOP shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of or inability to use the Service. Our total liability shall not exceed the amount you paid for your current subscription period.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">9. Service Availability</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                We strive to maintain continuous availability of the Service but do not guarantee uninterrupted access. The Service may be temporarily unavailable due to maintenance, updates, or circumstances beyond our control. We will make reasonable efforts to notify users of planned downtime.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">10. Account Termination</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                We reserve the right to suspend or terminate your account if you violate these Terms or engage in fraudulent, abusive, or unlawful activity. Upon termination, your access to the Service will be revoked and no refund will be issued for the remaining subscription period.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">11. Modifications to Terms</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                We may revise these Terms from time to time. When we make changes, we will update the "Last updated" date at the top of this page. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">12. Governing Law</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the Republic of the Philippines. Any disputes arising from these Terms shall be resolved in the appropriate courts of the Philippines.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">13. Contact Us</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                If you have any questions about these Terms, please contact us:
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
