import { motion } from 'motion/react';
import { Download, Play, ShieldCheck } from 'lucide-react';
import { Button } from './ui/button';
import { Link } from 'react-router';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4aa]/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00bcd4]/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00d4aa]/10 to-[#00bcd4]/10 border border-[#00d4aa]/20 text-ev-accent text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-ev-accent" />
            Professional Desktop Photobooth Software
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-4 bg-gradient-to-r from-ev-text-primary via-[#b0f0e0] to-[#a0e8f0] bg-clip-text text-transparent leading-tight"
        >
          Luis&Co.
          <br />
          Photobooth App
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-sm md:text-base text-ev-text-muted mb-8 flex items-center justify-center gap-2"
        >
          <ShieldCheck className="w-4 h-4 text-ev-accent" />
          Operated by <strong className="text-ev-text-secondary">LUIS&CO. ONLINE SHOP</strong> — DTI/BIR-Registered Business
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-xl md:text-2xl text-ev-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Transform any event into an unforgettable experience with our premium desktop photobooth application. Download the app, choose a subscription plan, and start capturing stunning photos at weddings, parties, and corporate events.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.4)] hover:shadow-[rgba(0,212,170,0.6)] transition-all duration-300 group"
          >
            <Download className="mr-2 h-5 w-5" />
            Download Now
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 border-ev-border hover:border-ev-accent hover:bg-ev-accent/10 transition-all duration-300"
          >
            <Link to="/pricing">
              View Subscription Plans
            </Link>
          </Button>
        </motion.div>

        {/* Product preview placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Placeholder for product screenshot */}
            <div className="relative bg-gradient-to-br from-ev-surface/50 to-[#141820]/50 rounded-2xl border border-ev-border/50 p-4">
              <div className="aspect-video bg-gradient-to-br from-ev-surface to-[#141820] rounded-xl flex items-center justify-center border border-ev-border/50">
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#00d4aa]/20 to-[#00bcd4]/20 flex items-center justify-center border border-ev-accent/30">
                    <Play className="w-12 h-12 text-ev-accent" />
                  </div>
                  <p className="text-ev-text-muted">Product Preview / Demo Video</p>
                  <p className="text-sm text-ev-text-muted/60 mt-2">Replace with actual app screenshot or video</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
