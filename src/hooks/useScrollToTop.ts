import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Automatically scroll to top on route change
 * This mimics native app behavior where each new screen starts at the top
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Use smooth scroll for better UX
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "smooth",
    });
  }, [pathname]);
};
