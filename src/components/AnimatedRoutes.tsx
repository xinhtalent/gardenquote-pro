import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Dashboard from "@/pages/Dashboard";
import Quotes from "@/pages/Quotes";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import ItemLibrary from "@/pages/ItemLibrary";
import CreateQuote from "@/pages/CreateQuote";
import QuoteDetail from "@/pages/QuoteDetail";
import Settings from "@/pages/Settings";
import AccountSettings from "@/pages/AccountSettings";
import Users from "@/pages/Users";
import Reports from "@/pages/Reports";
import PotPricingSettings from "@/pages/PotPricingSettings";
import AIChatQuote from "@/pages/AIChatQuote";
import NotFound from "@/pages/NotFound";

// Page wrapper with animation - optimized for performance
const PageWrapper = ({ children }: { children: React.ReactNode }) => {
  const pageVariants = {
    initial: {
      opacity: 0,
      x: 20,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: {
      opacity: 0,
      x: -20,
    },
  };

  const pageTransition = {
    type: "tween",
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1], // easeInOut
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={pageTransition}
      className="w-full h-full"
      style={{
        // Don't use transform to avoid creating stacking context
        // which breaks fixed positioning of child elements
      }}
    >
      {children}
    </motion.div>
  );
};

export const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageWrapper><Dashboard /></PageWrapper>} />
        <Route path="/quotes" element={<PageWrapper><Quotes /></PageWrapper>} />
        <Route path="/customers" element={<PageWrapper><Customers /></PageWrapper>} />
        <Route path="/customer/:phone" element={<PageWrapper><CustomerDetail /></PageWrapper>} />
        <Route path="/item-library" element={<PageWrapper><ItemLibrary /></PageWrapper>} />
        <Route path="/create-quote" element={<PageWrapper><CreateQuote /></PageWrapper>} />
        <Route path="/quote/:id" element={<PageWrapper><QuoteDetail /></PageWrapper>} />
        <Route path="/settings" element={<PageWrapper><Settings /></PageWrapper>} />
        <Route path="/account-settings" element={<PageWrapper><AccountSettings /></PageWrapper>} />
        <Route path="/users" element={<PageWrapper><Users /></PageWrapper>} />
        <Route path="/reports" element={<PageWrapper><Reports /></PageWrapper>} />
        <Route path="/pot-pricing-settings" element={<PageWrapper><PotPricingSettings /></PageWrapper>} />
        <Route path="/ai-chat" element={<PageWrapper><AIChatQuote /></PageWrapper>} />
        <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
      </Routes>
    </AnimatePresence>
  );
};
