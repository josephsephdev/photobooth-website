import { motion } from 'motion/react';
import { ShieldCheck, Building2, Globe, CreditCard, Mail, MapPin } from 'lucide-react';

export function BusinessIdentity() {
  return (
    <section className="relative py-24 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-[#00d4aa]/5 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-[#00bcd4]/5 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-ev-accent text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" />
            Verified Business
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-ev-text-primary to-ev-text-secondary bg-clip-text text-transparent">
            About Our Business
          </h2>
          <p className="text-xl text-ev-text-secondary max-w-3xl mx-auto">
            Luis&Co. Photobooth App is proudly developed and operated by a registered Philippine business.
          </p>
        </motion.div>

        {/* Business Identity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="relative mb-12"
        >
          <div className="relative bg-gradient-to-br from-ev-surface/90 to-ev-surface-elevated/90 rounded-2xl p-8 md:p-10 border border-ev-border">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-ev-accent/20 to-ev-cyan/20 flex items-center justify-center border border-ev-accent/30">
                  <Building2 className="w-8 h-8 text-ev-accent" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-ev-text-primary mb-2">LUIS&CO. ONLINE SHOP</h3>
                <p className="text-ev-accent font-medium mb-4">DTI/BIR-Registered Business</p>
                <p className="text-ev-text-secondary leading-relaxed mb-6">
                  LUIS&CO. ONLINE SHOP is a DTI/BIR-registered business in the Philippines offering digital products, apps, and subscriptions. Our flagship product, <strong className="text-ev-text-primary">Luis&Co. Photobooth App</strong>, is a professional desktop photobooth application designed for event photographers, wedding planners, corporate event organizers, and photobooth rental businesses.
                </p>
                <p className="text-ev-text-secondary leading-relaxed">
                  We are committed to providing high-quality software tools for the events industry. Our subscription plans give customers full access to a feature-rich photobooth application with ongoing updates, support, and cloud-based features.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Details Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Building2,
              title: 'Legal Business Name',
              content: 'LUIS&CO. ONLINE SHOP',
              subtitle: 'DTI/BIR-Registered',
            },
            {
              icon: Globe,
              title: 'Product / Brand',
              content: 'Luis&Co. Photobooth App',
              subtitle: 'luiscophotobooth.app',
            },
            {
              icon: CreditCard,
              title: 'Business Type',
              content: 'Digital Apps & Subscriptions',
              subtitle: 'Software as a Service (SaaS)',
            },
            {
              icon: MapPin,
              title: 'Location',
              content: 'Philippines',
              subtitle: 'Serving customers nationwide',
            },
            {
              icon: Mail,
              title: 'Contact',
              content: 'luiscophotobooth@gmail.com',
              subtitle: 'Business inquiries welcome',
            },
            {
              icon: ShieldCheck,
              title: 'Payment Processing',
              content: 'Secured via Xendit',
              subtitle: 'Safe & verified transactions',
            },
          ].map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3 }}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-ev-surface/80 to-ev-surface-elevated/80 rounded-2xl p-6 border border-ev-border group-hover:border-ev-accent/30 transition-colors duration-200 h-full">
                <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-[#00d4aa]/15 to-[#00bcd4]/15 mb-4">
                  <item.icon className="w-5 h-5 text-ev-accent" />
                </div>
                <p className="text-sm text-ev-text-muted mb-1">{item.title}</p>
                <p className="text-lg font-semibold text-ev-text-primary mb-1">{item.content}</p>
                <p className="text-sm text-ev-text-secondary">{item.subtitle}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
