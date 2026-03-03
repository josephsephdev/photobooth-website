import { motion } from 'motion/react';
import { Star, Quote } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

export function Testimonials() {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Event Photographer",
      company: "Moments Studio",
      content: "This app transformed my photobooth business. The quality is incredible and setup takes minutes instead of hours. My clients are always impressed!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1759560270562-468e8ba866e3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMGV2ZW50JTIwcHJvZmVzc2lvbmFsJTIwcGhvdG9ncmFwaHl8ZW58MXx8fHwxNzcyMTkxMzkxfDA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      name: "Michael Chen",
      role: "Wedding Planner",
      company: "Elite Events Co.",
      content: "We use this at every wedding we coordinate. The instant sharing via QR codes is a game-changer. Guests love it and it adds so much value to our service.",
      rating: 5,
      image: "https://images.unsplash.com/photo-1745847768366-d44dcef9ef35?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBwaG90b2dyYXBoeSUyMHN0dWRpbyUyMGNhbWVyYXxlbnwxfHx8fDE3NzIxOTEzODl8MA&ixlib=rb-4.1.0&q=80&w=1080"
    },
    {
      name: "Emily Rodriguez",
      role: "Corporate Event Manager",
      company: "Tech Solutions Inc.",
      content: "Perfect for our corporate events. Professional output, reliable performance, and the branding options let us customize everything. Worth every penny!",
      rating: 5,
      image: "https://images.unsplash.com/photo-1770012977129-19f856a1f935?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjB0ZWNobm9sb2d5JTIwaW50ZXJmYWNlJTIwZGFya3xlbnwxfHx8fDE3NzIxOTEzOTB8MA&ixlib=rb-4.1.0&q=80&w=1080"
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
            Loved by Professionals
          </h2>
          <p className="text-xl text-ev-text-secondary max-w-2xl mx-auto">
            Join thousands of event professionals who trust our app
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="group relative"
            >
              <div className="absolute -inset-1 bg-gradient-to-r from-[#00d4aa] to-[#00bcd4] rounded-2xl opacity-0 group-hover:opacity-15 blur-xl transition-opacity duration-500" />
              
              <div className="relative h-full bg-gradient-to-br from-ev-surface/90 to-ev-surface-elevated/90 rounded-2xl p-8 border border-ev-border group-hover:border-[rgba(0,212,170,0.3)] transition-all duration-300 backdrop-blur-sm flex flex-col">
                {/* Quote icon */}
                <div className="mb-6">
                  <Quote className="w-10 h-10 text-ev-accent opacity-50" />
                </div>

                {/* Rating */}
                <div className="flex gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>

                {/* Content */}
                <p className="text-ev-text-secondary leading-relaxed mb-6 flex-grow">
                  "{testimonial.content}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-ev-surface border-2 border-ev-accent/30">
                    <ImageWithFallback
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="font-bold text-ev-text-primary">{testimonial.name}</div>
                    <div className="text-sm text-ev-text-secondary">{testimonial.role}</div>
                    <div className="text-sm text-ev-accent">{testimonial.company}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8"
        >
          {[
            { value: "4.9/5", label: "Average Rating" },
            { value: "2,500+", label: "Happy Customers" },
            { value: "50,000+", label: "Events Hosted" },
            { value: "24/7", label: "Support Available" }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-ev-accent to-ev-cyan bg-clip-text text-transparent mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-ev-text-secondary">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
