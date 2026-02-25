import { useState, useEffect } from 'react';

/**
 * Custom hook to detect if the virtual keyboard is visible on mobile devices
 * Returns true when keyboard is open, false when closed
 */
export const useKeyboardVisible = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    // Only run on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (!isMobile) return;

    // Use Visual Viewport API if available (more reliable for keyboard detection)
    if (window.visualViewport) {
      const handleResize = () => {
        const viewport = window.visualViewport;
        if (!viewport) return;

        // When keyboard opens, the viewport height decreases
        // We compare it to the window height to detect keyboard
        const heightDiff = window.innerHeight - viewport.height;
        
        // If height difference is significant (> 150px), keyboard is likely open
        // This threshold helps avoid false positives from browser chrome changes
        setIsKeyboardVisible(heightDiff > 150);
      };

      window.visualViewport.addEventListener('resize', handleResize);
      window.visualViewport.addEventListener('scroll', handleResize);

      // Initial check
      handleResize();

      return () => {
        window.visualViewport?.removeEventListener('resize', handleResize);
        window.visualViewport?.removeEventListener('scroll', handleResize);
      };
    } else {
      // Fallback for browsers without Visual Viewport API
      const initialHeight = window.innerHeight;
      
      const handleResize = () => {
        const currentHeight = window.innerHeight;
        const heightDiff = initialHeight - currentHeight;
        
        // If window height decreased significantly, keyboard is likely open
        setIsKeyboardVisible(heightDiff > 150);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    }
  }, []);

  return isKeyboardVisible;
};
