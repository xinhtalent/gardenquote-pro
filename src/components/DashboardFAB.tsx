import { useState } from "react";
import { Plus, FileText, Package, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";

export const DashboardFAB = () => {
  const [showFabMenu, setShowFabMenu] = useState(false);
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  // Only show on dashboard page
  if (!isDashboard) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 md:hidden">
      {/* Backdrop */}
      {showFabMenu && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm -z-10"
          onClick={() => setShowFabMenu(false)}
        />
      )}
      
      {/* Menu Options */}
      {showFabMenu && (
        <div className="absolute bottom-20 right-0 flex flex-col gap-3 mb-2">
          <Link to="/ai-chat">
            <Button 
              size="lg"
              className="flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-200 whitespace-nowrap bg-card hover:bg-card/90 text-foreground border-2 border-border min-w-[180px] justify-start"
              onClick={() => setShowFabMenu(false)}
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Chat AI</span>
            </Button>
          </Link>
          <Link to="/create-quote">
            <Button 
              size="lg"
              className="flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-200 whitespace-nowrap bg-card hover:bg-card/90 text-foreground border-2 border-border min-w-[180px] justify-start"
              onClick={() => setShowFabMenu(false)}
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Thêm báo giá</span>
            </Button>
          </Link>
          <Link to="/item-library">
            <Button 
              size="lg"
              className="flex items-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-200 whitespace-nowrap bg-card hover:bg-card/90 text-foreground border-2 border-border min-w-[180px] justify-start"
              onClick={() => setShowFabMenu(false)}
            >
              <div className="p-2 bg-primary/10 rounded-lg">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Thêm hạng mục</span>
            </Button>
          </Link>
        </div>
      )}
      
      {/* Main FAB Button */}
      <Button 
        size="icon"
        className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
        onClick={() => setShowFabMenu(!showFabMenu)}
      >
        <Plus className={`w-6 h-6 transition-transform duration-200 ${showFabMenu ? 'rotate-45' : ''}`} />
      </Button>
    </div>
  );
};
