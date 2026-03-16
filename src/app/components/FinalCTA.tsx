import { motion } from 'motion/react';
import { Download, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router';

export function FinalCTA() {
  const benefits = [
    "Flexible subscription plans",
    "Full feature access",
    "Regular updates included",
    "Setup in minutes"
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00d4aa]/10 rounded-full blur-[80px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#00bcd4]/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mb-8"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00d4aa]/10 to-[#00bcd4]/10 border border-[#00d4aa]/20 text-ev-accent text-sm font-medium mb-8">
            <span className="w-2 h-2 rounded-full bg-ev-accent" />
            Start Your Free Trial Today
          </span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-ev-text-primary via-[#b0f0e0] to-[#a0e8f0] bg-clip-text text-transparent leading-tight"
        >
          Elevate Your Photobooth Business Today
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-xl md:text-2xl text-ev-text-secondary mb-12 max-w-3xl mx-auto"
        >
          Download Luis&Co. Photobooth App and choose a subscription plan that works for you. Start creating unforgettable event experiences.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
        >
          <Button
            size="lg"
            className="text-xl px-12 py-8 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-2xl shadow-[rgba(0,212,170,0.4)] hover:shadow-[rgba(0,212,170,0.6)] transition-all duration-300 group"
          >
            <Download className="mr-3 h-6 w-6" />
            Download Now
            <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-xl px-12 py-8 border-ev-border hover:border-ev-accent hover:bg-ev-accent/10 transition-all duration-300"
          >
            <Link to="/pricing">
              View Plans & Pricing
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-6 mb-12"
        >
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-2 text-ev-text-secondary">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              <span>{benefit}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="text-sm text-ev-text-muted"
        >
          Compatible with Windows · Secure payments via Xendit · Operated by LUIS&CO. ONLINE SHOP
        </motion.div>
      </div>

      {/* Bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-ev-accent to-transparent" />
    </section>
  );
}
