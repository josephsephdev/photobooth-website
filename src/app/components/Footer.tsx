import { Camera, Mail, ShieldCheck, Facebook, Instagram } from 'lucide-react';
import { Link } from 'react-router';

export function Footer() {
  const productLinks = [
    { label: 'Features', href: '/#features' },
    { label: 'Pricing', to: '/pricing' },
    { label: 'Download', href: '/#download' },
    { label: 'How It Works', href: '/#how-it-works' },
  ];

  const legalLinks = [
    { label: 'Terms of Service', to: '/terms-of-service' },
    { label: 'Privacy Policy', to: '/privacy-policy' },
    { label: 'Terms and Conditions', to: '/terms-and-conditions' },
    { label: 'Refund & Cancellation Policy', to: '/refund-policy' },
  ];

  const companyLinks = [
    { label: 'About / Business Info', to: '/about' },
    { label: 'Contact Us', to: '/contact-us' },
  ];

  const socialLinks = [
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
  ];

  return (
    <footer className="relative border-t border-ev-border">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
          {/* Brand & Business Identity */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-ev-text-primary">Luis&Co. Photobooth App</span>
            </div>
            <p className="text-ev-text-secondary mb-4 leading-relaxed">
              Professional desktop photobooth application for weddings, parties, corporate events, and more. Download the app and subscribe to start creating unforgettable photo experiences.
            </p>
            <div className="flex items-start gap-2 mb-4 p-3 rounded-lg bg-ev-surface/60 border border-ev-border/50">
              <ShieldCheck className="w-5 h-5 text-ev-accent flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-ev-text-primary">Operated by LUIS&CO. ONLINE SHOP</p>
                <p className="text-xs text-ev-text-muted">DTI/BIR-Registered Business · Digital Apps & Subscriptions</p>
              </div>
            </div>
            <div className="flex gap-4">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  aria-label={social.label}
                  className="w-10 h-10 rounded-lg bg-ev-surface hover:bg-gradient-to-br hover:from-ev-accent hover:to-ev-cyan flex items-center justify-center transition-all duration-300 group"
                >
                  <social.icon className="w-5 h-5 text-ev-text-muted group-hover:text-white transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-bold text-ev-text-primary mb-4">Product</h3>
            <ul className="space-y-3">
              {productLinks.map((link, index) => (
                <li key={index}>
                  {link.to ? (
                    <Link
                      to={link.to}
                      className="text-ev-text-secondary hover:text-ev-accent transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <a
                      href={link.href}
                      className="text-ev-text-secondary hover:text-ev-accent transition-colors duration-300"
                    >
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-bold text-ev-text-primary mb-4">Company</h3>
            <ul className="space-y-3">
              {companyLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-ev-text-secondary hover:text-ev-accent transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h3 className="font-bold text-ev-text-primary mb-4">Legal</h3>
            <ul className="space-y-3">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <Link
                    to={link.to}
                    className="text-ev-text-secondary hover:text-ev-accent transition-colors duration-300"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter */}
        <div className="border-t border-ev-border pt-12 mb-12">
          <div className="max-w-xl">
            <h3 className="text-xl font-bold text-ev-text-primary mb-4">Stay Updated</h3>
            <p className="text-ev-text-secondary mb-4">Get the latest updates, tips, and exclusive offers delivered to your inbox.</p>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-ev-text-muted" />
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-3 bg-[#0a0e14] border border-ev-border rounded-[var(--ev-radius-sm)] text-ev-text-primary placeholder-ev-text-muted focus:outline-none focus:border-ev-accent focus:shadow-[0_0_0_3px_rgba(0,212,170,0.25)] transition-all"
                />
              </div>
              <button className="px-6 py-3 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] rounded-[var(--ev-radius-sm)] font-semibold text-[#0a0e14] transition-all duration-300">
                Subscribe
              </button>
            </div>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-ev-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
            <p className="text-ev-text-muted text-sm">
              © {new Date().getFullYear()} Luis&Co. Photobooth App. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-ev-text-muted">
              <Link to="/privacy-policy" className="hover:text-ev-accent transition-colors">Privacy Policy</Link>
              <Link to="/terms-and-conditions" className="hover:text-ev-accent transition-colors">Terms</Link>
              <Link to="/refund-policy" className="hover:text-ev-accent transition-colors">Refund Policy</Link>
            </div>
          </div>
          <p className="text-center text-xs text-ev-text-muted/70">
            Operated by LUIS&CO. ONLINE SHOP · Digital Apps & Subscriptions · luiscophotobooth.app
          </p>
        </div>
      </div>
    </footer>
  );
}
