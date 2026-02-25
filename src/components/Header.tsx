import { useState, useEffect, useRef } from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEmojiFirework } from "@/components/EmojiFirework";
import { useLocation } from "react-router-dom";
import { useGlobalSettings } from "@/hooks/useSettings";

export const Header = () => {
  const isMobile = useIsMobile();
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollTimeout = useRef<NodeJS.Timeout>();
  const { trigger: triggerFirework, FireworkContainer } = useEmojiFirework();
  
  // Check if on AI Chat page
  const isAIChatPage = location.pathname.startsWith('/ai-chat');

  // ✅ Use React Query hook for global settings with realtime
  const { data: globalSettings } = useGlobalSettings();
  const appName = globalSettings?.app_name || "Hệ thống báo giá";
  const companyLogo = globalSettings?.company_logo_url || null;
  const companyName = globalSettings?.company_name || null;

  // Scroll detection for both mobile and desktop (skip on AI Chat page)
  useEffect(() => {
    // Don't apply scroll logic on AI Chat page - always hide header there
    if (isAIChatPage) {
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear previous timeout
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }

      // Show header when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY.current || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      }

      lastScrollY.current = currentScrollY;

      // Show header after scroll stops
      scrollTimeout.current = setTimeout(() => {
        if (window.scrollY < 50) {
          setIsVisible(true);
        }
      }, 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
      }
    };
  }, [isAIChatPage]);


  // Don't render header on AI Chat page
  if (isAIChatPage) {
    return <>{FireworkContainer}</>;
  }

  return (
    <>
      {FireworkContainer}
      <header 
        className={`print-hide h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 transition-transform duration-300 ${
          !isVisible ? '-translate-y-full' : 'translate-y-0'
        }`}
      >
        <div className="h-full flex items-center justify-between px-4 gap-4">
          {/* Left: Sidebar Trigger + App Name (hide app name on mobile) */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <SidebarTrigger className="shrink-0" />
            
            {/* App Name - Ẩn trên mobile nhỏ để ưu tiên logo */}
            {!isMobile && (
              <span className="font-semibold text-lg truncate">
                {appName}
              </span>
            )}
          </div>

          {/* Right: Company Logo - Luôn hiển thị */}
          <button
            onClick={triggerFirework}
            className="shrink-0 cursor-pointer transition-transform hover:scale-105 active:scale-95"
          >
            {companyLogo ? (
              <img 
                src={companyLogo} 
                alt="Company Logo"
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : companyName ? (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">
                  {companyName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            ) : null}
          </button>
        </div>
      </header>
    </>
  );
};
