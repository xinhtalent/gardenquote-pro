import { Home, Package, FileText, Settings, Users } from "lucide-react";
import { NavLink } from "react-router-dom";

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
import { Separator } from "@/components/ui/separator";

const items = [
  { title: "Trang chủ", url: "/", icon: Home },
  { title: "Báo giá", url: "/quotes", icon: FileText },
  { title: "Khách hàng", url: "/customers", icon: Users },
  { title: "Thư viện hạng mục", url: "/item-library", icon: Package },
  { title: "Cài đặt", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar 
      className={open ? "w-64" : "w-16"} 
      collapsible="icon"
    >
      <SidebarContent className="pt-4">
        <SidebarGroup>
          <SidebarGroupLabel className={!open ? "sr-only" : "px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider"}>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent className="px-2 mt-2">
            <SidebarMenu className="space-y-1">
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-12">
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative ${
                          isActive
                            ? "bg-primary text-primary-foreground font-semibold shadow-md before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-1 before:h-8 before:bg-primary-foreground before:rounded-r-full"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        }`
                      }
                    >
                      <item.icon className={`h-5 w-5 ${open ? "" : "mx-auto"}`} />
                      {open && <span className="text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border">
        <div className="p-4 flex items-center justify-between gap-2">
          <div className="flex-1">
            <UserProfile />
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
