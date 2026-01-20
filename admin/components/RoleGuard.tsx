"use client";
import { useEffect } from "react";
import { useAuth, UserRole } from "@/hooks/useAuth";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { role, isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      window.location.href = "/login";
      return;
    }

    // If role is not allowed, redirect to appropriate dashboard
    if (role && !allowedRoles.includes(role)) {
      const redirectMap: Record<string, string> = {
        admin: "/admin/dashboard",
        chef: "/chef/dashboard",
        superadmin: "/superadmin/dashboard",
      };

      const redirectUrl = redirectMap[role] || "/login";
      window.location.href = redirectUrl;
    }
  }, [role, isLoading, isAuthenticated, allowedRoles]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Verifying access...</p>
        </div>
      </div>
    );
  }

  // If not authenticated or wrong role, show nothing (will redirect)
  if (!isAuthenticated || (role && !allowedRoles.includes(role))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-red-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Access denied. Redirecting...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
