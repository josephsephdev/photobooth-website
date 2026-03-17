import { Link } from 'react-router';
import { motion } from 'motion/react';
import { Camera, ArrowLeft, Mail, Phone, MapPin, User, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Footer } from '../components/Footer';
import { useState } from 'react';

export default function ContactUs() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

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

        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-2xl font-bold text-ev-text-primary mb-6">Send Us a Message</h2>
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4aa] to-[#00bcd4] rounded-2xl opacity-10 blur-xl" />
            <div className="relative bg-gradient-to-br from-ev-surface/90 to-ev-surface-elevated/90 rounded-2xl p-8 md:p-10 border border-ev-border">
              {submitted ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-ev-accent/20 to-ev-cyan/20 flex items-center justify-center mx-auto mb-4 border border-ev-accent/30">
                    <Send className="w-8 h-8 text-ev-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-ev-text-primary mb-2">Message Sent!</h3>
                  <p className="text-ev-text-secondary mb-6">
                    Thank you for reaching out. We'll get back to you within 1–2 business days.
                  </p>
                  <Button
                    onClick={() => { setSubmitted(false); setFormData({ fullName: '', email: '', subject: '', message: '' }); }}
                    className="bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-ev-text-secondary mb-2">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="Juan Dela Cruz"
                        className="w-full px-4 py-3 bg-[#0a0e14] border border-ev-border rounded-[var(--ev-radius-sm)] text-ev-text-primary placeholder-ev-text-muted focus:outline-none focus:border-ev-accent focus:shadow-[0_0_0_3px_rgba(0,212,170,0.25)] transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-ev-text-secondary mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        className="w-full px-4 py-3 bg-[#0a0e14] border border-ev-border rounded-[var(--ev-radius-sm)] text-ev-text-primary placeholder-ev-text-muted focus:outline-none focus:border-ev-accent focus:shadow-[0_0_0_3px_rgba(0,212,170,0.25)] transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-ev-text-secondary mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="How can we help?"
                      className="w-full px-4 py-3 bg-[#0a0e14] border border-ev-border rounded-[var(--ev-radius-sm)] text-ev-text-primary placeholder-ev-text-muted focus:outline-none focus:border-ev-accent focus:shadow-[0_0_0_3px_rgba(0,212,170,0.25)] transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-ev-text-secondary mb-2">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Tell us more about your inquiry..."
                      className="w-full px-4 py-3 bg-[#0a0e14] border border-ev-border rounded-[var(--ev-radius-sm)] text-ev-text-primary placeholder-ev-text-muted focus:outline-none focus:border-ev-accent focus:shadow-[0_0_0_3px_rgba(0,212,170,0.25)] transition-all resize-none"
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full sm:w-auto bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/30 hover:shadow-ev-accent/50 transition-all duration-300 px-8 py-3 gap-2"
                  >
                    <Send className="w-4 h-4" />
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>

          <p className="text-sm text-ev-text-muted mt-6 text-center">
            We aim to respond to all inquiries within 1–2 business days.
          </p>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
}
