import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Footer } from '../components/Footer';

export default function TermsOfService() {
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
          <h1 className="text-4xl md:text-5xl font-bold text-ev-text-primary mb-4">Terms of Service</h1>
          <p className="text-ev-text-muted mb-12">Last updated: March 17, 2026</p>

          <div className="prose prose-invert max-w-none space-y-8">
            {/* Section 1 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">1. Acceptance of Terms</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                By using the <strong className="text-ev-text-primary">Luis&Co. Photobooth</strong> application (accessible at luiscophotobooth.app and via desktop download), you agree to these Terms of Service. If you do not agree to these terms, please do not use our application.
              </p>
            </section>

            {/* Section 2 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">2. Service Description</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Luis&Co. Photobooth provides professional software for capturing photos and videos at events, including weddings, parties, corporate events, and more. The application includes optional features to:
              </p>
              <ul className="list-disc list-inside text-ev-text-secondary space-y-2 ml-4">
                <li>Capture and process high-quality photos and videos</li>
                <li>Apply filters, watermarks, and effects to your media</li>
                <li>Connect to your Google Drive for cloud storage and sharing</li>
                <li>Manage subscriptions and access premium features</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">3. User Responsibilities</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                As a user of Luis&Co. Photobooth, you are responsible for:
              </p>
              <ul className="list-disc list-inside text-ev-text-secondary space-y-2 ml-4">
                <li>All content captured and stored through the application</li>
                <li>Complying with all local privacy laws and regulations when photographing guests at events</li>
                <li>Obtaining proper consent from all individuals whose photos or videos are captured</li>
                <li>Securing your login credentials and account information</li>
                <li>Maintaining appropriate use of the application and its features</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">4. Third-Party Services</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Luis&Co. Photobooth integrates with third-party services, including but not limited to:
              </p>
              <ul className="list-disc list-inside text-ev-text-secondary space-y-2 ml-4">
                <li><strong className="text-ev-text-primary">Google Drive:</strong> For cloud storage and file sharing</li>
                <li><strong className="text-ev-text-primary">Xendit:</strong> For payment processing and subscriptions</li>
                <li><strong className="text-ev-text-primary">Appwrite:</strong> For backend services and data management</li>
              </ul>
              <p className="text-ev-text-secondary leading-relaxed mt-4">
                By using these features, you agree to be bound by the Terms of Service and Privacy Policies of these third-party providers. We are not responsible for service interruptions, data loss, or any issues arising from these external platforms.
              </p>
            </section>

            {/* Section 5 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">5. Limitation of Liability</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Luis&Co. Photobooth is provided <strong className="text-ev-text-primary">"as is"</strong> without any warranties, express or implied. We are not liable for:
              </p>
              <ul className="list-disc list-inside text-ev-text-secondary space-y-2 ml-4">
                <li>Loss of data or corrupted files during an event</li>
                <li>Hardware failures or system crashes</li>
                <li>Internet connectivity issues</li>
                <li>Third-party service interruptions or failures</li>
                <li>Any indirect, incidental, or consequential damages</li>
              </ul>
              <p className="text-ev-text-secondary leading-relaxed mt-4">
                It is your responsibility to back up important files and use the application on reliable hardware.
              </p>
            </section>

            {/* Section 6 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">6. Subscription and Payment</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                Users may subscribe to premium features through our payment processor. All subscription payments are subject to our Refund & Cancellation Policy. By subscribing, you authorize recurring charges until you cancel your subscription.
              </p>
            </section>

            {/* Section 7 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">7. Prohibited Uses</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                You agree not to use Luis&Co. Photobooth for:
              </p>
              <ul className="list-disc list-inside text-ev-text-secondary space-y-2 ml-4">
                <li>Illegal or harmful activities</li>
                <li>Capturing or distributing content without proper consent</li>
                <li>Reverse engineering or attempting to access source code</li>
                <li>Circumventing subscription protections or payment requirements</li>
              </ul>
            </section>

            {/* Section 8 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">8. Changes to Terms</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                We reserve the right to update these Terms of Service at any time. Changes will be effective immediately upon posting. Your continued use of the application after changes constitutes acceptance of the new terms.
              </p>
            </section>

            {/* Section 9 */}
            <section className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
              <h2 className="text-2xl font-bold text-ev-text-primary">9. Contact Us</h2>
              <p className="text-ev-text-secondary leading-relaxed">
                If you have questions about these Terms of Service, please contact us at:
              </p>
              <div className="mt-4 p-4 rounded-lg bg-ev-surface border border-ev-border/50">
                <p className="text-ev-text-secondary">
                  <strong className="text-ev-text-primary">Email:</strong> luiscophotobooth@gmail.com
                </p>
                <p className="text-ev-text-secondary mt-2">
                  <strong className="text-ev-text-primary">Business:</strong> LUIS&CO. ONLINE SHOP (DTI/BIR-Registered)
                </p>
              </div>
            </section>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
