import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { Camera, Check, Sparkles, Zap, Crown } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';

const plans = [
  {
    id: 'event_pass',
    name: 'Event Pass',
    tagline: 'Perfect for one-time events',
    duration: '1 Day',
    price: '₱150',
    priceNote: 'one-time',
    description:
      'For one day',
    features: [
      'Unlock all features for 24 hours',
      'Unlimited photo captures',
      'Premium filters',
      'Instant digital sharing',
      'Event-branded templates',
      'Watermark-free professional exports',
    ],
    icon: Zap,
    popular: false,
    gradient: 'from-[#00d4aa] to-[#00bcd4]',
    glowColor: 'ev-accent',
  },
  {
    id: 'monthly',
    name: 'Pro Monthly',
    tagline: 'Best value for active creators',
    duration: '30 Days',
    price: '₱700',
    priceNote: '/month',
    description:
      'For growing photobooth businesses',
    features: [
      'Everything in Event Pass',
      'Unlimited events every month',
      'More flexibility, more value',
      'Watermark-free professional exports',
    ],
    icon: Sparkles,
    popular: true,
    gradient: 'from-[#00d4aa] to-[#00bcd4]',
    glowColor: 'ev-accent',
  },
  {
    id: 'yearly',
    name: 'Studio Annual',
    tagline: 'Maximum savings for professionals',
    duration: '12 Months',
    price: '₱7,000',
    priceNote: '/year',
    description:
      'For serious long-term use',
    features: [
      'Everything in Pro Monthly',
      'Save ₱1,400+ vs paying monthly',
      'Our best-value plan',
      'Watermark-free professional exports',
    ],
    icon: Crown,
    popular: false,
    gradient: 'from-[#00bcd4] to-[#0088a3]',
    glowColor: 'ev-cyan',
  },
];

export default function Pricing() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  /** Handle plan selection → navigate to billing config page */
  const handleSelectPlan = (planId: string) => {
    setError('');

    if (!isAuthenticated) {
      navigate('/signin');
      return;
    }

    navigate(`/billing/configure?plan=${planId}`);
  };

  return (
    <div className="min-h-screen text-ev-text-primary flex flex-col">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#00d4aa]/6 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#00bcd4]/6 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#00d4aa]/3 rounded-full blur-3xl" />
      </div>

      {/* Header / Logo */}
      <div className="relative z-10 px-6 pt-8">
        <Link to="/" className="inline-flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center shadow-lg shadow-[rgba(0,212,170,0.3)] group-hover:shadow-[rgba(0,212,170,0.5)] transition-shadow">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-ev-text-primary">Luis&Co. Photobooth</span>
        </Link>
      </div>

      {/* Page content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00d4aa]/10 border border-[#00d4aa]/20 text-ev-accent text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            Simple, transparent pricing
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-ev-text-primary mb-4 leading-tight">
            Subscription Plans for{' '}
            <span className="bg-gradient-to-r from-ev-accent to-ev-cyan bg-clip-text text-transparent">
              Luis&Co. Photobooth App
            </span>
          </h1>
          <p className="text-ev-text-secondary text-lg mb-3">
            Choose a plan that fits your needs. All plans include full access to our professional desktop photobooth application with regular updates and support.
          </p>
          <p className="text-sm text-ev-text-muted">
            Operated by LUIS&CO. ONLINE SHOP · Payments secured via Xendit
          </p>
        </motion.div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl w-full mx-auto items-stretch">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const isHovered = hoveredCard === plan.id;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.15 * index }}
                onMouseEnter={() => setHoveredCard(plan.id)}
                onMouseLeave={() => setHoveredCard(null)}
                className="relative flex"
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                    <div className="px-4 py-1 rounded-full bg-gradient-to-r from-ev-accent to-ev-cyan text-[#0a0e14] text-xs font-semibold tracking-wide shadow-lg shadow-[rgba(0,212,170,0.3)]">
                      MOST POPULAR
                    </div>
                  </div>
                )}

                {/* Card */}
                <div
                  className={`relative flex flex-col w-full rounded-2xl p-[1px] transition-all duration-500 ${
                    plan.popular
                      ? 'bg-gradient-to-b from-[#00d4aa]/60 via-[#00bcd4]/30 to-[#00d4aa]/10'
                      : isHovered
                        ? 'bg-gradient-to-b from-[#2a3040]/80 to-[#1a1f2e]/40'
                        : 'bg-[#2a3040]/40'
                  }`}
                >
                  <div
                    className={`relative flex flex-col flex-1 rounded-2xl p-8 transition-all duration-500 ${
                      plan.popular
                        ? 'bg-ev-surface/90 backdrop-blur-xl'
                        : 'bg-ev-surface/70 backdrop-blur-xl'
                    }`}
                  >
                    {/* Glow effect for popular */}
                    {plan.popular && (
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-[#00d4aa]/5 via-transparent to-[#00bcd4]/5 pointer-events-none" />
                    )}

                    {/* Plan icon & name */}
                    <div className="relative z-10 mb-6">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4 shadow-lg shadow-${plan.glowColor}/25`}
                      >
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-ev-text-primary mb-1">{plan.name}</h3>
                      <p className="text-sm text-ev-text-secondary">{plan.tagline}</p>
                    </div>

                    {/* Price */}
                    <div className="relative z-10 mb-6">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-ev-text-primary">{plan.price}</span>
                        <span className="text-ev-text-muted text-sm font-medium">{plan.priceNote}</span>
                      </div>
                      <div className="mt-1 text-xs text-ev-text-muted font-medium uppercase tracking-wider">
                        {plan.duration} access
                      </div>
                    </div>

                    {/* Description */}
                    <p className="relative z-10 text-sm text-ev-text-secondary leading-relaxed mb-7">
                      {plan.description}
                    </p>

                    {/* Features */}
                    <ul className="relative z-10 space-y-3 mb-8 flex-1">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-3">
                          <div
                            className={`w-5 h-5 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center flex-shrink-0 mt-0.5`}
                          >
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                          <span className="text-sm text-ev-text-secondary">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA */}
                    <div className="relative z-10 mt-auto">
                      {plan.popular ? (
                        <Button
                          onClick={() => handleSelectPlan(plan.id)}
                          className="w-full h-12 bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-[rgba(0,212,170,0.25)] hover:shadow-[rgba(0,212,170,0.4)] transition-all duration-300 text-sm"
                        >
                          Get Started
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleSelectPlan(plan.id)}
                          variant="outline"
                          className="w-full h-12 border-ev-border hover:border-ev-accent/50 bg-ev-surface-elevated/40 hover:bg-ev-accent/10 text-ev-text-primary font-semibold transition-all duration-300 text-sm"
                        >
                          Get Started
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 text-center text-sm text-ev-danger bg-ev-danger/10 border border-ev-danger/20 rounded-xl px-4 py-3 max-w-md"
          >
            {error}
          </motion.div>
        )}

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.7 }}
          className="text-center text-ev-text-muted text-sm mt-12 max-w-lg"
        >
          All plans include access to our core photobooth features. Payments are processed securely via Xendit.{' '}
          <Link to="/about" className="text-ev-accent hover:text-ev-accent-hover font-medium transition-colors">
            Learn more about our business
          </Link>
        </motion.p>
      </div>
    </div>
  );
}
