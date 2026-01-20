"use client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChefSidebar } from "@/components/chef/chef.sidebar";
import { ThemeProvider } from "@/components/themeSwitch";
import Navbar from "@/components/header";
import { RoleGuard } from "@/components/RoleGuard";

export function ChefLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["chef"]}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light"
        enableSystem
        disableTransitionOnChange
      >
        <SidebarProvider>
          <div className="flex h-screen w-full">
            <ChefSidebar />
            <div className="flex flex-col flex-1 overflow-hidden">
              <Navbar />
              <main className="flex-1 overflow-y-auto bg-gray-50 p-6 rounded-lg shadow-lg transition duration-200 ease-linear mr-1 mt-1 m-2 border-1">
                {children}
              </main>
            </div>
          </div>
        </SidebarProvider>
      </ThemeProvider>
    </RoleGuard>
  );
}
