import { motion } from 'motion/react';
import { Settings, Camera, Sparkles, Share2 } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Settings,
      title: "Set Up Event",
      description: "Configure your event settings, templates, and branding in minutes",
      color: "purple"
    },
    {
      number: "02",
      icon: Camera,
      title: "Capture Photos",
      description: "Let guests snap amazing photos with DSLR quality and live previews",
      color: "cyan"
    },
    {
      number: "03",
      icon: Sparkles,
      title: "Process Output",
      description: "Instantly apply templates, filters, and effects with one click",
      color: "pink"
    },
    {
      number: "04",
      icon: Share2,
      title: "Print & Share",
      description: "Print on the spot or share instantly via QR code and cloud upload",
      color: "blue"
    }
  ];

  const colorMap: Record<string, string> = {
    purple: "from-[#00d4aa] to-[#00bcd4]",
    cyan: "from-[#00bcd4] to-[#0088a3]",
    pink: "from-[#e040fb] to-[#ab47bc]",
    blue: "from-[#00bcd4] to-[#00d4aa]"
  };

  return (
    <section className="relative py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-ev-text-primary to-ev-text-secondary bg-clip-text text-transparent">
            How It Works
          </h2>
          <p className="text-xl text-ev-text-secondary max-w-2xl mx-auto">
            Get up and running in four simple steps
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-[#00d4aa]/20 via-[#00bcd4]/20 to-[#00d4aa]/20 -translate-y-1/2" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="relative group"
              >
                {/* Number badge */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-10">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${colorMap[step.color]} flex items-center justify-center shadow-lg shadow-${step.color}-500/50`}>
                    <span className="text-2xl font-bold text-white">{step.number}</span>
                  </div>
                </div>

                {/* Card */}
                <div className="relative mt-8 bg-gradient-to-br from-ev-surface/90 to-ev-surface-elevated/90 rounded-2xl p-8 pt-12 border border-ev-border group-hover:border-[rgba(0,212,170,0.3)] transition-all duration-300 backdrop-blur-sm min-h-[280px]">
                  {/* Glow effect */}
                  <div className={`absolute -inset-1 bg-gradient-to-br ${colorMap[step.color]} rounded-2xl opacity-0 group-hover:opacity-20 blur-xl transition-opacity duration-500`} />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${colorMap[step.color]} bg-opacity-10 mb-6`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>

                    <h3 className="text-2xl font-bold text-ev-text-primary mb-4">{step.title}</h3>
                    <p className="text-ev-text-secondary leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Arrow (desktop only) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-20">
                    <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colorMap[step.color]} flex items-center justify-center`}>
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
