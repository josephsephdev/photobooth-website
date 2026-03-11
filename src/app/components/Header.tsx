import { motion } from 'motion/react';
import { Camera, Menu, X, UserCircle, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../context/AuthContext';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSignOut = () => {
    signOut();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-[#0a0e14]/80 backdrop-blur-xl border-b border-ev-border/50 shadow-[var(--ev-shadow-lg)]' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <motion.a
            href="#"
            className="flex items-center gap-3 group"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ev-accent to-ev-cyan flex items-center justify-center shadow-lg shadow-ev-accent/30 group-hover:shadow-ev-accent/50 transition-shadow">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-ev-text-primary">Luis&Co. Photobooth</span>
          </motion.a>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            
            <Button
              asChild
              variant="outline"
              className="border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary transition-all duration-300 relative group overflow-hidden"
            >
              <Link to="/pricing">
                <span className="relative z-10">Pricing</span>
                <div className="absolute inset-0 bg-gradient-to-r from-ev-accent/0 via-ev-accent/10 to-ev-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              className="border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary transition-all duration-300 relative group overflow-hidden"
            >
              <Link to="/contact-us">
                <span className="relative z-10">Contact Us</span>
                <div className="absolute inset-0 bg-gradient-to-r from-ev-accent/0 via-ev-accent/10 to-ev-cyan/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </Link>
            </Button>

            {isAuthenticated ? (
              /* Account button — signed in */
              <Button
                asChild
                className="bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/30 hover:shadow-ev-accent/50 transition-all duration-300 ml-1 gap-2"
              >
                <Link to="/account">
                  <span className="w-6 h-6 rounded-full bg-[#0a0e14]/20 flex items-center justify-center text-xs font-bold leading-none">
                    {user?.avatarInitial ?? <UserCircle className="w-4 h-4" />}
                  </span>
                  Account
                </Link>
              </Button>
            ) : (
              /* Sign In — public CTA */
              <Button
                asChild
                className="bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/30 hover:shadow-ev-accent/50 transition-all duration-300 ml-1"
              >
                <Link to="/signin">Sign In</Link>
              </Button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden w-10 h-10 rounded-[var(--ev-radius-sm)] bg-ev-surface/50 hover:bg-ev-surface-hover/50 flex items-center justify-center transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-5 h-5 text-ev-text-primary" />
            ) : (
              <Menu className="w-5 h-5 text-ev-text-primary" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-ev-border/50 py-6"
          >
            <nav className="flex flex-col gap-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary"
              >
                <Link to="/pricing" onClick={() => setIsMobileMenuOpen(false)}>Pricing</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start border-ev-border hover:border-ev-accent/50 bg-ev-surface/30 hover:bg-ev-accent/10 text-ev-text-primary"
              >
                <Link to="/contact-us" onClick={() => setIsMobileMenuOpen(false)}>Contact Us</Link>
              </Button>

              {isAuthenticated ? (
                <>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/30 gap-2"
                  >
                    <Link to="/account" onClick={() => setIsMobileMenuOpen(false)}>
                      <UserCircle className="w-4 h-4" />
                      Account
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-ev-text-secondary hover:text-ev-danger hover:bg-ev-danger/10 gap-2"
                    onClick={handleSignOut}
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="w-full justify-start text-ev-text-secondary hover:text-ev-text-primary hover:bg-ev-surface/50"
                  >
                    <Link to="/signin" onClick={() => setIsMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-ev-accent to-ev-cyan hover:from-ev-accent-hover hover:to-[#00d0e8] text-[#0a0e14] font-semibold shadow-lg shadow-ev-accent/30"
                  >
                    <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>Create Account</Link>
                  </Button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </motion.header>
  );
}
