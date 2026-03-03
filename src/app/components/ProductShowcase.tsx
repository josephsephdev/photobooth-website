import { motion } from 'motion/react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Sparkles, Zap, Layers } from 'lucide-react';

export function ProductShowcase() {
  const showcaseItems = [
    {
      title: "Intuitive Interface",
      description: "Modern, easy-to-use dashboard designed for speed and efficiency",
      icon: Layers,
      image: "https://images.unsplash.com/photo-1770012977129-19f856a1f935?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwaW50ZXJmYWNlJTIwZGFya3xlbnwxfHx8fDE3NzIxOTEzOTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Google Drive Integration",
      description: "Securely back up event photos to your Google Drive for easy access and sharing",
      icon: Zap,
      image: "https://images.unsplash.com/photo-1745847768366-d44dcef9ef35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwaG90b2dyYXBoeSUyMHN0dWRpbyUyMGNhbWVyYXxlbnwxfHx8fDE3NzIxOTEzODl8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      title: "Advanced Features",
      description: "Professional tools that make your photobooth stand out",
      icon: Sparkles,
      image: "https://images.unsplash.com/photo-1569100922030-8dedef93800e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnN0YW50JTIwcGhvdG8lMjBwcmludGVyJTIwcG9sYXJvaWR8ZW58MXx8fHwxNzcyMTkxMzkxfDA&ixlib=rb-4.1.0&q=80&w=1080"
    }
  ];

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
            Built for Businesses
          </h2>
          <p className="text-xl text-ev-text-secondary max-w-2xl mx-auto">
            Every feature crafted to deliver exceptional photobooth experiences
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {showcaseItems.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              {/* Glow effect on hover */}
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4aa] to-[#00bcd4] rounded-2xl opacity-0 group-hover:opacity-15 blur-xl transition-opacity duration-500" />
              
              <div className="relative bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl overflow-hidden border border-ev-border group-hover:border-[rgba(0,212,170,0.3)] transition-all duration-300 backdrop-blur-sm">
                {/* Image placeholder */}
                <div className="relative h-64 overflow-hidden bg-ev-surface">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ev-surface via-ev-surface/50 to-transparent" />
                  
                  {/* Icon overlay */}
                  <div className="absolute top-4 left-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d4aa]/20 to-[#00bcd4]/20 backdrop-blur-sm border border-ev-accent/30 flex items-center justify-center">
                      <item.icon className="w-6 h-6 text-ev-accent" />
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-2xl font-bold text-ev-text-primary mb-3">{item.title}</h3>
                  <p className="text-ev-text-secondary leading-relaxed">{item.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Large featured screenshot placeholder */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 relative"
        >
          <div className="absolute -inset-4 bg-gradient-to-r from-[#00d4aa] via-[#00bcd4] to-[#00d4aa] rounded-3xl opacity-15 blur-3xl" />
          
          <div className="relative bg-gradient-to-br from-ev-surface-elevated/50 to-ev-surface/50 rounded-3xl border border-ev-border/50 backdrop-blur-sm p-6">
            <div className="aspect-[16/9] bg-gradient-to-br from-ev-surface to-[#141820] rounded-2xl flex items-center justify-center border border-ev-border/50">
              <div className="text-center max-w-md">
                <div className="w-32 h-32 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[#00d4aa]/20 to-[#00bcd4]/20 flex items-center justify-center border border-ev-accent/30">
                  <Layers className="w-16 h-16 text-ev-accent" />
                </div>
                <h3 className="text-2xl font-bold text-ev-text-primary mb-3">Full App Interface Preview</h3>
                <p className="text-ev-text-muted">Replace with main dashboard screenshot or demo</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
