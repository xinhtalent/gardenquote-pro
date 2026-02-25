import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Loading indicator that shows briefly during route transitions
 * Gives users feedback that navigation is happening
 */
export const RouteLoadingIndicator = () => {
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show loading indicator on route change
    setIsLoading(true);

    // Hide after a brief moment (matches transition duration)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          exit={{ scaleX: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-primary via-primary-light to-primary origin-left"
          style={{
            transformOrigin: "left",
          }}
        />
      )}
    </AnimatePresence>
  );
};
