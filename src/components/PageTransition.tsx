import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Smooth page transition animations optimized for mobile
export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();

  // Different animation variants for different navigation patterns
  const pageVariants = {
    initial: {
      opacity: 0,
      x: 20,
      scale: 0.98,
    },
    animate: {
      opacity: 1,
      x: 0,
      scale: 1,
    },
    exit: {
      opacity: 0,
      x: -20,
      scale: 0.98,
    },
  };

  // Smooth spring transition for app-like feel
  const pageTransition = {
    type: "spring",
    stiffness: 380,
    damping: 30,
    mass: 0.8,
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        className="w-full h-full"
        style={{
          // Optimize for mobile performance
          willChange: "opacity, transform",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
          perspective: 1000,
          WebkitPerspective: 1000,
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Alternative: Bottom sheet style animation (like native mobile apps)
export const MobilePageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();

  const mobileVariants = {
    initial: {
      y: "100%",
      opacity: 0,
    },
    animate: {
      y: 0,
      opacity: 1,
    },
    exit: {
      y: "-5%",
      opacity: 0,
    },
  };

  const mobileTransition = {
    type: "spring",
    stiffness: 400,
    damping: 35,
    mass: 0.7,
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={mobileVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={mobileTransition}
        className="w-full h-full"
        style={{
          willChange: "transform, opacity",
          backfaceVisibility: "hidden",
          WebkitBackfaceVisibility: "hidden",
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Fade transition for subtle navigation
export const FadePageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();

  const fadeVariants = {
    initial: {
      opacity: 0,
    },
    animate: {
      opacity: 1,
    },
    exit: {
      opacity: 0,
    },
  };

  const fadeTransition = {
    duration: 0.2,
    ease: [0.4, 0, 0.2, 1], // easeInOut
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        variants={fadeVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={fadeTransition}
        className="w-full h-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};
