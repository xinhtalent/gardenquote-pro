import { Home, Package, FileText, Settings, Users, BarChart3, MessageSquare } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { useSwipeGesture } from "@/hooks/useSwipeGesture";
import { useIsMobile } from "@/hooks/use-mobile";
import React from "react";
import { supabase } from "@/integrations/supabase/client";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { UserProfile } from "@/components/UserProfile";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppSidebar() {
  const { open, setOpen, openMobile, setOpenMobile } = useSidebar();
  const { isAdmin } = useUserRole();
  const isMobile = useIsMobile();
  const location = useLocation();
  const [libraryTitle, setLibraryTitle] = React.useState("Thư viện hạng mục");

  // Fetch library title from settings
  React.useEffect(() => {
    const fetchLibraryTitle = async () => {
      const { data } = await supabase
        .from('global_settings')
        .select('library_title')
        .maybeSingle();
      
      if (data?.library_title) {
        setLibraryTitle(data.library_title);
      }
    };

    fetchLibraryTitle();

    // Subscribe to changes
    const channel = supabase
      .channel('global_settings_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'global_settings'
        },
        (payload) => {
          if (payload.new && (payload.new as any).library_title) {
            setLibraryTitle((payload.new as any).library_title);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const baseItems = [
    { title: "Trang chủ", url: "/", icon: Home },
    { title: "Báo giá", url: "/quotes", icon: FileText },
    { title: "Chat AI Báo giá", url: "/ai-chat", icon: MessageSquare },
    { title: "Khách hàng", url: "/customers", icon: Users },
    { title: libraryTitle, url: "/item-library", icon: Package },
    { title: "Cài đặt", url: "/settings", icon: Settings },
  ];

  const adminItems = [
    { title: "Quản lý người dùng", url: "/users", icon: Users },
    { title: "Báo cáo", url: "/reports", icon: BarChart3 },
  ];
  
  const items = isAdmin ? [...baseItems, ...adminItems] : baseItems;

  // Close sidebar on mobile when clicking nav item
  const handleMobileClose = () => {
    if (isMobile && openMobile) {
      setOpenMobile(false);
    }
  };

  // Tự động đóng khi route thay đổi trên mobile (không theo dõi openMobile để tránh đóng khi mở)
  React.useEffect(() => {
    setOpenMobile(false);
  }, [location.pathname, setOpenMobile]);

  // Swipe gesture for mobile - only on edge and only on homepage
  useSwipeGesture({
    onSwipeRight: () => {
      if (isMobile && !openMobile && location.pathname === "/") {
        setOpenMobile(true);
      }
    },
    onSwipeLeft: () => {
      if (isMobile && openMobile && location.pathname === "/") {
        setOpenMobile(false);
      }
    },
    minSwipeDistance: 100,
    edgeOnly: true,
    edgeWidth: 30,
    minHorizontalRatio: 1.5,
  });

  return (
    <Sidebar 
      className={isMobile ? (openMobile ? "w-64" : "w-0") : (open ? "w-64" : "w-16")} 
      collapsible="icon"
    >
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className={!open ? "sr-only" : "px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 mt-2">
            <SidebarMenu className="space-y-1">
              {items.map((item) => {
                const isActive = item.url === "/" 
                  ? location.pathname === "/" 
                  : location.pathname === item.url || location.pathname.startsWith(item.url + "/");
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild className="h-12">
                      <NavLink
                        to={item.url}
                        onClick={handleMobileClose}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 font-semibold ${
                          isActive
                            ? "bg-primary/10 text-primary shadow-soft"
                            : "text-foreground hover:bg-secondary hover:text-primary"
                        }`}
                      >
                        <item.icon className={`h-5 w-5 ${open ? "" : "mx-auto"}`} />
                        {open && <span className="text-sm">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className={`border-t border-border transition-opacity duration-200 ${(isMobile || open) ? 'opacity-100' : 'opacity-0 h-0 overflow-hidden'}`}>
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="flex-1">
            <UserProfile />
          </div>
          <div>
            <ThemeToggle />
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
