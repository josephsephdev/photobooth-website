import { motion } from 'motion/react';
import { Camera, Sparkles, Zap, Share2, Cloud, Printer, Layout, Gauge } from 'lucide-react';

export function Features() {
  const features = [
    {
      icon: Camera,
      title: "DSLR & Webcam Support",
      description: "Connect professional DSLR cameras or use built-in webcams for maximum flexibility",
      gradient: "from-[#00d4aa] to-[#00bcd4]"
    },
    {
      icon: Layout,
      title: "Template Designer",
      description: "Create stunning custom layouts with our intuitive drag-and-drop designer",
      gradient: "from-[#00bcd4] to-[#0088a3]"
    },
    {
      icon: Zap,
      title: "Instant Outputs",
      description: "Generate high-quality photos in seconds with optimized processing pipeline",
      gradient: "from-[#f59e0b] to-[#d97706]"
    },
    {
      icon: Sparkles,
      title: "GIF Creation",
      description: "Capture moments in motion with animated GIF support and custom effects",
      gradient: "from-[#e040fb] to-[#ab47bc]"
    },
    {
      icon: Share2,
      title: "QR Code Sharing",
      description: "Instant digital delivery via QR codes - guests get their photos immediately",
      gradient: "from-[#22c55e] to-[#16a34a]"
    },
    {
      icon: Cloud,
      title: "Google Drive Upload",
      description: "Automatic cloud backup and organization directly to Google Drive",
      gradient: "from-[#00bcd4] to-[#00d4aa]"
    },
    {
      icon: Printer,
      title: "Printer Integration",
      description: "Seamless connection with photo printers for instant physical prints",
      gradient: "from-[#ef4444] to-[#dc2626]"
    },
    {
      icon: Gauge,
      title: "Event-Ready Workflow",
      description: "Complete event management system designed for high-volume sessions",
      gradient: "from-[#e040fb] to-[#00d4aa]"
    }
  ];

  return (
    <section className="relative py-32">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00d4aa]/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#00bcd4]/8 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-ev-text-primary to-ev-text-secondary bg-clip-text text-transparent">
            Everything You Need
          </h2>
          <p className="text-xl text-ev-text-secondary max-w-2xl mx-auto">
            Powerful features designed to make your photobooth business effortless
          </p>
        </motion.div>

        {/* Bento grid layout */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const isLarge = index === 0 || index === 3;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className={`group relative ${isLarge ? 'lg:col-span-2' : ''}`}
              >
                <div className="relative h-full bg-gradient-to-br from-ev-surface/90 to-ev-surface-elevated/90 rounded-2xl p-8 border border-ev-border group-hover:border-[rgba(0,212,170,0.3)] transition-colors duration-200">
                  {/* Icon */}
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} bg-opacity-10 mb-6`}>
                    <feature.icon className={`w-8 h-8 bg-gradient-to-br ${feature.gradient} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent', backgroundClip: 'text' }} />
                  </div>

                  <h3 className="text-2xl font-bold text-ev-text-primary mb-4">{feature.title}</h3>
                  <p className="text-ev-text-secondary leading-relaxed">{feature.description}</p>

                  {/* Decorative corner */}
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${feature.gradient} opacity-5 rounded-bl-full`} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
