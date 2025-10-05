import { Home, Package, FileText, Settings } from "lucide-react";
import { NavLink } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Trang chủ", url: "/", icon: Home },
  { title: "Báo giá", url: "/quotes", icon: FileText },
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
                        `flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 ${
                          isActive
                            ? "bg-primary/10 text-primary font-semibold shadow-soft"
                            : "text-foreground hover:bg-secondary hover:text-primary"
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
    </Sidebar>
  );
}
