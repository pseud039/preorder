"use client";
import { Calendar, Home, Inbox, Search, Settings } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const items = [
  {
    title: "Dashboard",
    url: "/admin/dashboard",
    icon: Home,
  },
  {
    title: "Menu",
    url: "/admin/menu",
    icon: Calendar,
  },
  {
    title: "Orders",
    url: "/admin/orders",
    icon: Inbox,
  },
  {
    title: "Customers",
    url: "/admin/customers",
    icon: Search,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: Settings,
  },
]

export function AppSidebar() {
  return (
    <Sidebar variant="floating">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-lg text-orange-600 my-5">
            <img src="/image.png" alt="Predine Logo" className="inline-block w-10 h-10 mr-2" />
            Preorder
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
  )
}