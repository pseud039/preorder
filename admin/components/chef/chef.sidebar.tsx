"use client";
import { Home, ShoppingBag } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/chef/dashboard",
    icon: Home,
  },
  {
    title: "Orders",
    url: "/chef/orders",
    icon: ShoppingBag,
  },
];

export function ChefSidebar() {
  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg text-orange-600 my-5">
            <img
              src="/image.png"
              alt="Predine Logo"
              className="inline-block w-10 h-10 mr-2"
            />
            Chef Portal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    className="m-1 py-3 hover:bg-orange-600 active:bg-orange-600 hover:text-white active:text-white rounded-lg"
                  >
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
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
