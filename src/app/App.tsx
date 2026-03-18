import { Routes, Route, Navigate, useLocation } from 'react-router';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { ProductShowcase } from './components/ProductShowcase';
import { Features } from './components/Features';
import { HowItWorks } from './components/HowItWorks';
import { WhyChoose } from './components/WhyChoose';
import { Testimonials } from './components/Testimonials';
import { BusinessIdentity } from './components/BusinessIdentity';
import { FinalCTA } from './components/FinalCTA';
import { Footer } from './components/Footer';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Pricing from './pages/Pricing';
import Account from './pages/Account';
import CheckoutSuccess from './pages/CheckoutSuccess';
import CheckoutCancel from './pages/CheckoutCancel';
import VerifyEmail from './pages/VerifyEmail';
import VerifyEmailSent from './pages/VerifyEmailSent';
import RequestVerificationEmail from './pages/RequestVerificationEmail';
import About from './pages/About';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import TermsAndConditions from './pages/TermsAndConditions';
import RefundPolicy from './pages/RefundPolicy';
import BillingConfig from './pages/BillingConfig';
import ContactUs from './pages/ContactUs';
import { useAuth } from './context/AuthContext';

function LandingPage() {
  return (
    <div className="min-h-screen text-ev-text-primary antialiased">
      <Header />
      <Hero />
      <ProductShowcase />
      <Features />
      <HowItWorks />
      <WhyChoose />
      <Testimonials />
      <BusinessIdentity />
      <FinalCTA />
      <Footer />
    </div>
  );
}

function RequireAuth({ children }: { children: React.ReactElement }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen text-ev-text-primary flex items-center justify-center">
        <p className="text-sm text-ev-text-secondary">Checking session...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(`${location.pathname}${location.search}`);
    return <Navigate to={`/signin?redirect=${redirect}`} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route
        path="/billing/configure"
        element={
          <RequireAuth>
            <BillingConfig />
          </RequireAuth>
        }
      />
      <Route
        path="/account"
        element={
          <RequireAuth>
            <Account />
          </RequireAuth>
        }
      />
      <Route
        path="/checkout/success"
        element={
          <RequireAuth>
            <CheckoutSuccess />
          </RequireAuth>
        }
      />
      <Route
        path="/checkout/cancel"
        element={
          <RequireAuth>
            <CheckoutCancel />
          </RequireAuth>
        }
      />
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/verify-email-sent" element={<VerifyEmailSent />} />
      <Route path="/request-verification-email" element={<RequestVerificationEmail />} />
      <Route path="/about" element={<About />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/contact-us" element={<ContactUs />} />
    </Routes>
  );
}