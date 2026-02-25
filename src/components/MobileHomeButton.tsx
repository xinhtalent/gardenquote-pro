import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";

export const MobileHomeButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === "/";
  const isKeyboardVisible = useKeyboardVisible();

  // Don't show on home page or when keyboard is open
  if (isHomePage || isKeyboardVisible) return null;

  return (
    <Button
      size="icon"
      onClick={() => navigate("/")}
      className="print-hide fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 z-40 md:hidden"
      aria-label="Về trang chủ"
    >
      <Home className="w-6 h-6" />
    </Button>
  );
};
