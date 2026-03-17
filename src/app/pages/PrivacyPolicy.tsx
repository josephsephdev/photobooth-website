import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Footer } from '../components/Footer';

export default function PrivacyPolicy() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-ev-text-primary mb-4">Privacy Policy</h1>
          <p className="text-ev-text-muted mb-12">Last updated: March 4, 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">1. Introduction</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                This Privacy Policy describes how <strong className="text-ev-text-primary">LUIS&CO. ONLINE SHOP</strong> ("we," "us," or "our"), the operator of <strong className="text-ev-text-primary">Luis&Co. Photobooth App</strong> (accessible at luiscophotobooth.app), collects, uses, and protects your personal information when you use our website, desktop application, and subscription services.
              </p>
              <p className="text-ev-text-secondary leading-relaxed">
                LUIS&CO. ONLINE SHOP is a DTI/BIR-registered business in the Philippines offering digital products, apps, and subscriptions.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">2. Information We Collect</h2>
              <p className="text-ev-text-secondary leading-relaxed">We may collect the following types of information:</p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li><strong className="text-ev-text-primary">Account Information:</strong> Name, email address, and password when you create an account.</li>
                <li><strong className="text-ev-text-primary">Billing Information:</strong> Payment details processed securely through our payment provider, Xendit. We do not store your full credit card or payment account numbers on our servers.</li>
                <li><strong className="text-ev-text-primary">Usage Data:</strong> Information about how you use the application, including features accessed, session duration, and technical data such as device type and operating system version.</li>
                <li><strong className="text-ev-text-primary">Support Communications:</strong> Messages, emails, or inquiries you send to our support team.</li>
              </ul>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">3. How We Use Your Information</h2>
              <p className="text-ev-text-secondary leading-relaxed">We use the collected information to:</p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li>Provide, maintain, and improve our application and services.</li>
                <li>Process subscription payments and manage your account.</li>
                <li>Send important notifications about your account, subscription status, or service updates.</li>
                <li>Respond to your support requests and inquiries.</li>
                <li>Ensure security, prevent fraud, and protect our users.</li>
                <li>Comply with legal obligations.</li>
              </ul>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">4. Data Sharing & Third Parties</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                We do not sell your personal information. We may share limited data with trusted third-party service providers who help us operate our business:
              </p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li><strong className="text-ev-text-primary">Xendit</strong> — for secure payment processing.</li>
                <li><strong className="text-ev-text-primary">Appwrite</strong> — for authentication and cloud database services.</li>
                <li><strong className="text-ev-text-primary">Google Drive</strong> — for optional cloud photo backup (user-initiated).</li>
              </ul>
              <p className="text-ev-text-secondary leading-relaxed">
                These providers are contractually obligated to protect your information and may only use it in connection with the services they provide to us.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">5. How We Use Google User Data</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                <strong className="text-ev-text-primary">LuisCo Photobooth</strong> accesses your Google Drive to provide cloud storage and sharing features for your photobooth events.
              </p>
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-ev-text-primary mb-2">Data Access</h3>
                  <p className="text-ev-text-secondary leading-relaxed">
                    Our app requests the drive.file scope. This allows us to create a dedicated folder (e.g., "[Event Name]") on your Google Drive and upload only the photos and videos captured during your event sessions.
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-ev-text-primary mb-2">Data Storage & Sharing</h3>
                  <p className="text-ev-text-secondary leading-relaxed">
                    Photos are stored directly on your personal Google Drive. To enable guest sharing via QR code, our app generates a public sharing link for these specific files/folders as instructed by you.
                  </p>
                </div>
                <div className="bg-ev-surface/50 border-l-4 border-ev-accent p-4 rounded">
                  <h3 className="font-bold text-ev-accent mb-2">Limited Use Disclosure</h3>
                  <p className="text-ev-text-secondary leading-relaxed">
                    <strong>LuisCo Photobooth's use and transfer of information received from Google APIs to any other app will adhere to <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="text-ev-accent hover:text-ev-accent-hover underline">Google API Services User Data Policy</a>, including the Limited Use requirements.</strong>
                  </p>
                </div>
                <div>
                  <h3 className="font-bold text-ev-text-primary mb-2">Data Retention</h3>
                  <p className="text-ev-text-secondary leading-relaxed">
                    We do not store your Google credentials or files on our own servers. Your data remains in your Google Drive and is governed by your own Google account settings.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">6. Data Security</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                We implement reasonable security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">7. Your Rights</h2>
              <p className="text-ev-text-secondary leading-relaxed">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-ev-text-secondary">
                <li>Access and review the personal information we hold about you.</li>
                <li>Request correction of inaccurate information.</li>
                <li>Request deletion of your account and associated data.</li>
                <li>Opt out of non-essential communications.</li>
              </ul>
              <p className="text-ev-text-secondary leading-relaxed">
                To exercise any of these rights, please contact us at <strong className="text-ev-accent">support@luiscophotobooth.app</strong>.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">8. Cookies & Tracking</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Our website may use cookies and similar technologies to improve your browsing experience, analyze site traffic, and understand usage patterns. You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">9. Children's Privacy</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Our services are not directed to children under 13 years of age. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child without appropriate consent, we will take steps to delete that information.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">10. Changes to This Policy</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                We may update this Privacy Policy from time to time. When we do, we will revise the "Last updated" date at the top of this page. We encourage you to review this page periodically for any changes.
              </p>
            </section>

            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">11. Contact Us</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us:
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
