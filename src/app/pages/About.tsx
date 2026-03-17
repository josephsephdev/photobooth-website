import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ShieldCheck, Building2, Globe, CreditCard, Mail, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Footer } from '../components/Footer';

export default function About() {
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
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-ev-accent text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Verified Business
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-ev-text-primary mb-4">
            About{' '}
            <span className="bg-gradient-to-r from-ev-accent to-ev-cyan bg-clip-text text-transparent">
              Luis&Co. Photobooth App
            </span>
          </h1>
          <p className="text-lg text-ev-text-secondary max-w-2xl mx-auto">
            Learn about the business behind the product.
          </p>
        </motion.div>

        {/* Business Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative mb-12"
        >
          <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4aa] to-[#00bcd4] rounded-2xl opacity-10 blur-xl" />
          <div className="relative bg-gradient-to-br from-ev-surface/90 to-ev-surface-elevated/90 rounded-2xl p-8 md:p-10 border border-ev-border">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ev-accent/20 to-ev-cyan/20 flex items-center justify-center border border-ev-accent/30">
                  <Building2 className="w-8 h-8 text-ev-accent" />
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-ev-text-primary mb-2">LUIS&CO. ONLINE SHOP</h2>
                <p className="text-ev-accent font-medium mb-4">DTI/BIR-Registered Business</p>
                <p className="text-ev-text-secondary leading-relaxed mb-4">
                  <strong className="text-ev-text-primary">LUIS&CO. ONLINE SHOP</strong> is a DTI/BIR-registered business in the Philippines offering digital products, apps, and subscriptions.
                </p>
                <p className="text-ev-text-secondary leading-relaxed mb-4">
                  Our flagship product, <strong className="text-ev-text-primary">Luis&Co. Photobooth App</strong>, is a professional-grade desktop photobooth application designed for event photographers, wedding planners, corporate event organizers, and photobooth rental businesses.
                </p>
                <p className="text-ev-text-secondary leading-relaxed">
                  The app is available as a downloadable desktop application for Windows. Customers can choose from flexible subscription plans — including a one-day Event Pass, a monthly Pro plan, or an annual Studio plan — to unlock full access to all features.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* What We Offer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-ev-text-primary mb-6">What We Offer</h2>
          <div className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border space-y-4">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-ev-accent flex-shrink-0 mt-1" />
              <p className="text-ev-text-secondary"><strong className="text-ev-text-primary">Luis&Co. Photobooth App</strong> — A downloadable desktop photobooth application with professional-grade features for events.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-ev-accent flex-shrink-0 mt-1" />
              <p className="text-ev-text-secondary"><strong className="text-ev-text-primary">Subscription-Based Access</strong> — Flexible plans (daily, monthly, yearly) that give users full access to all features.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-ev-accent flex-shrink-0 mt-1" />
              <p className="text-ev-text-secondary"><strong className="text-ev-text-primary">Ongoing Updates & Support</strong> — Regular software updates, new features, and customer support included with all plans.</p>
            </div>
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-ev-accent flex-shrink-0 mt-1" />
              <p className="text-ev-text-secondary"><strong className="text-ev-text-primary">Secure Payments</strong> — All transactions are processed securely through Xendit, a trusted payment platform.</p>
            </div>
          </div>
        </motion.div>

        {/* Business Details Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-ev-text-primary mb-6">Business Information</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: Building2, label: 'Legal Business Name', value: 'LUIS&CO. ONLINE SHOP' },
              { icon: Globe, label: 'Product / Brand Name', value: 'Luis&Co. Photobooth App' },
              { icon: Globe, label: 'Website', value: 'luiscophotobooth.app' },
              { icon: CreditCard, label: 'Business Type', value: 'Digital Apps & Subscriptions (SaaS)' },
              { icon: MapPin, label: 'Country of Operation', value: 'Philippines' },
              { icon: Mail, label: 'Contact Email', value: 'luiscophotobooth@gmail.com' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-xl p-5 border border-ev-border">
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-[#00d4aa]/15 to-[#00bcd4]/15 flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-ev-accent" />
                </div>
                <div>
                  <p className="text-sm text-ev-text-muted">{item.label}</p>
                  <p className="font-semibold text-ev-text-primary">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h2 className="text-2xl font-bold text-ev-text-primary mb-6">Contact Us</h2>
          <div className="bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-8 border border-ev-border">
            <p className="text-ev-text-secondary mb-4">
              For questions about our product, subscriptions, billing, or business verification, please contact us:
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-ev-accent" />
                <span className="text-ev-text-primary font-medium">support@luiscophotobooth.app</span>
              </div>
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-ev-accent" />
                <span className="text-ev-text-primary font-medium">https://luiscophotobooth.app</span>
              </div>
            </div>
            <p className="text-sm text-ev-text-muted mt-6">
              We aim to respond to all inquiries within 1–2 business days.
            </p>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
