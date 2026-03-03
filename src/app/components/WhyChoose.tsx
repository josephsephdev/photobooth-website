import { motion } from 'motion/react';
import { Zap, Shield, Award, TrendingUp, Users, Clock } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function WhyChoose() {
  const benefits = [
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Process and deliver photos in seconds, not minutes. Keep your event flowing smoothly."
    },
    {
      icon: Shield,
      title: "Reliable & Stable",
      description: "Built for mission-critical events. No crashes, no delays, no disappointed guests."
    },
    {
      icon: Award,
      title: "Professional Quality",
      description: "Studio-grade output that makes every photo print-worthy and share-ready."
    },
    {
      icon: TrendingUp,
      title: "Grow Your Business",
      description: "Advanced features and premium output help you charge more and book more events."
    },
    {
      icon: Users,
      title: "Easy for Everyone",
      description: "Intuitive interface means anyone can operate it - no technical skills required."
    },
    {
      icon: Clock,
      title: "Save Time",
      description: "Automated workflows and smart features let you handle more guests in less time."
    }
  ];

  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#00d4aa]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-0 w-96 h-96 bg-[#00bcd4]/8 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-ev-text-primary to-ev-text-secondary bg-clip-text text-transparent">
            Why Choose Our App?
          </h2>
          <p className="text-xl text-ev-text-secondary max-w-2xl mx-auto">
            The smarter, faster, more professional photobooth solution
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -inset-4 bg-gradient-to-r from-[#00d4aa] to-[#00bcd4] rounded-3xl opacity-15 blur-3xl" />
            <div className="relative rounded-3xl overflow-hidden border border-ev-border">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1764091319520-7507b5ad253a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWRkaW5nJTIwcmVjZXB0aW9uJTIwcGhvdG9ib290aCUyMGZ1bnxlbnwxfHx8fDE3NzIxOTEzOTF8MA&ixlib=rb-4.1.0&q=80&w=1080"
                alt="Event photobooth"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0a0e14] via-transparent to-transparent" />
            </div>
          </motion.div>

          {/* Benefits grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="group relative"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4aa] to-[#00bcd4] rounded-2xl opacity-0 group-hover:opacity-15 blur-xl transition-opacity duration-500" />
                
                <div className="relative bg-gradient-to-br from-ev-surface/90 to-ev-surface-elevated/90 rounded-2xl p-6 border border-ev-border group-hover:border-[rgba(0,212,170,0.3)] transition-all duration-300 backdrop-blur-sm">
                  <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-[#00d4aa]/20 to-[#00bcd4]/20 mb-4">
                    <benefit.icon className="w-6 h-6 text-ev-accent" />
                  </div>
                  <h3 className="text-xl font-bold text-ev-text-primary mb-2">{benefit.title}</h3>
                  <p className="text-ev-text-secondary text-sm leading-relaxed">{benefit.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="grid md:grid-cols-3 gap-8"
        >
          {[
            { value: "10,000+", label: "Events Powered" },
            { value: "99.9%", label: "Uptime Reliability" },
            { value: "5 sec", label: "Average Processing Time" }
          ].map((stat, index) => (
            <div
              key={index}
              className="relative group"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4aa] to-[#00bcd4] rounded-2xl opacity-0 group-hover:opacity-15 blur-xl transition-opacity duration-500" />
              
              <div className="relative bg-gradient-to-br from-ev-surface/90 to-ev-surface-elevated/90 rounded-2xl p-8 border border-ev-border text-center backdrop-blur-sm">
                <div className="text-5xl font-bold bg-gradient-to-r from-ev-accent to-ev-cyan bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-ev-text-secondary">{stat.label}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
