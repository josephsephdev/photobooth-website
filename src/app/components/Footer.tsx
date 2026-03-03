import { Camera, Mail, Twitter, Facebook, Instagram, Linkedin } from 'lucide-react';

export function Footer() {
  const footerLinks = {
    Product: ['Features', 'Pricing', 'Download', 'Updates', 'FAQ'],
    Resources: ['Documentation', 'Tutorials', 'Blog', 'Support', 'Community'],
    Company: ['About Us', 'Careers', 'Partners', 'Press Kit', 'Contact'],
    Legal: ['Privacy Policy', 'Terms of Service', 'License Agreement', 'Cookie Policy']
  };

  const socialLinks = [
    { icon: Twitter, href: '#', label: 'Twitter' },
    { icon: Facebook, href: '#', label: 'Facebook' },
    { icon: Instagram, href: '#', label: 'Instagram' },
    { icon: Linkedin, href: '#', label: 'LinkedIn' }
  ];

  return (
    <footer className="relative border-t border-ev-border">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-ev-text-primary">PhotoBooth Pro</span>
            </div>
            <p className="text-ev-text-secondary mb-6 leading-relaxed">
              Professional desktop photobooth application for unforgettable event experiences.
            </p>
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

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-bold text-ev-text-primary mb-4">{category}</h3>
              <ul className="space-y-3">
                {links.map((link, index) => (
                  <li key={index}>
                    <a
                      href="#"
                      className="text-ev-text-secondary hover:text-ev-accent transition-colors duration-300"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
        <div className="border-t border-ev-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-ev-text-muted text-sm">
            © {new Date().getFullYear()} PhotoBooth Pro. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-ev-text-muted">
            <a href="#" className="hover:text-ev-accent transition-colors">Privacy</a>
            <a href="#" className="hover:text-ev-accent transition-colors">Terms</a>
            <a href="#" className="hover:text-ev-accent transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
