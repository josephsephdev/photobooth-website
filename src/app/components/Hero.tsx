import { motion } from 'motion/react';
import { Download, Play } from 'lucide-react';
import { Button } from './ui/button';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00d4aa]/15 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#00bcd4]/15 rounded-full blur-[120px] animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00d4aa]/5 rounded-full blur-[150px]" />
      </div>

      {/* Grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#00d4aa]/10 to-[#00bcd4]/10 border border-[#00d4aa]/20 text-ev-accent text-sm font-medium backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-ev-accent animate-pulse" />
            The Future of Photobooths application is here
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-ev-text-primary via-[#b0f0e0] to-[#a0e8f0] bg-clip-text text-transparent leading-tight"
        >
          Professional
          <br />
          Photobooth
          <br />
          Made Simple
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-ev-text-secondary mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          Transform any event into an unforgettable experience with our premium desktop photobooth application. Professional-grade features, instant outputs, and seamless workflow.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Button
            size="lg"
            className="text-lg px-8 py-6 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.4)] hover:shadow-[rgba(0,212,170,0.6)] transition-all duration-300 group"
          >
            <Download className="mr-2 h-5 w-5 group-hover:animate-bounce" />
            Download Now
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="text-lg px-8 py-6 border-ev-border hover:border-ev-accent hover:bg-ev-accent/10 transition-all duration-300"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </motion.div>

        {/* Product preview placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="relative mx-auto max-w-5xl">
            {/* Glow effect */}
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00d4aa] via-[#00bcd4] to-[#00d4aa] rounded-2xl opacity-15 blur-2xl animate-pulse" />
            
            {/* Placeholder for product screenshot */}
            <div className="relative bg-gradient-to-br from-ev-surface/50 to-[#141820]/50 rounded-2xl border border-ev-border/50 backdrop-blur-sm p-4">
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
