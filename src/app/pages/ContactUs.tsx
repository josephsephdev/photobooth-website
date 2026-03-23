import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ArrowLeft, Mail, Phone, MapPin, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Footer } from '../components/Footer';

export default function ContactUs() {
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
        {/* Page Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-ev-accent text-sm font-medium mb-6">
            <Mail className="w-4 h-4" />
            Get in Touch
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-ev-text-primary mb-4">
            Contact{' '}
            <span className="bg-gradient-to-r from-ev-accent to-ev-cyan bg-clip-text text-transparent">
              Us
            </span>
          </h1>
          <p className="text-lg text-ev-text-secondary max-w-2xl mx-auto">
            Have questions about our photobooth software, subscriptions, or support? We're here to help. You may contact us through the details below or send us a message using the contact form.
          </p>
        </motion.div>

        {/* Contact Details */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-12"
        >
          <h2 className="text-2xl font-bold text-ev-text-primary mb-6">Contact Information</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-xl p-5 border border-ev-border">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#00d4aa]/15 to-[#00bcd4]/15 flex items-center justify-center">
                <User className="w-6 h-6 text-ev-accent" />
              </div>
              <div>
                <p className="text-sm text-ev-text-muted">Contact Person / Business Name</p>
                <p className="font-semibold text-ev-text-primary">Luis Miguel D. Moratalla</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-xl p-5 border border-ev-border">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#00d4aa]/15 to-[#00bcd4]/15 flex items-center justify-center">
                <Phone className="w-6 h-6 text-ev-accent" />
              </div>
              <div>
                <p className="text-sm text-ev-text-muted">Phone Number</p>
                <p className="font-semibold text-ev-text-primary">+63 9568128494</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-xl p-5 border border-ev-border">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#00d4aa]/15 to-[#00bcd4]/15 flex items-center justify-center">
                <MapPin className="w-6 h-6 text-ev-accent" />
              </div>
              <div>
                <p className="text-sm text-ev-text-muted">Address</p>
                <p className="font-semibold text-ev-text-primary">Pulong Sta. Cruz, Sta. Rosa, Laguna</p>
              </div>
            </div>

            {/* ⚠️ UPDATE THIS: Replace the placeholder email below with your real email */}
            <div className="flex items-center gap-4 bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-xl p-5 border border-ev-border">
              <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-[#00d4aa]/15 to-[#00bcd4]/15 flex items-center justify-center">
                <Mail className="w-6 h-6 text-ev-accent" />
              </div>
              <div>
                <p className="text-sm text-ev-text-muted">Email</p>
                <p className="font-semibold text-ev-text-primary">luiscophotobooth@gmail.com</p>
              </div>
            </div>
          </div>
        </motion.div>


      </div>

      <Footer />
    </div>
  );
}
