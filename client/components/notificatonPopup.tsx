"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Bell } from "lucide-react";
import { fetchWithAuth } from "@/lib/auth";
import { toast } from "sonner";

const NOTIFICATION_PROMPT_KEY = "notification_prompt_dismissed";
const NOTIFICATION_PROMPT_DELAY = 1 * 60 * 60 * 1000; // 1 hour before showing again if dismissed

export default function NotificatonPopup() {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Don't run on server
    if (typeof window === "undefined") return;

    // Check if notifications are supported
    if (!("Notification" in window) || !("serviceWorker" in navigator)) {
      return;
    }

    // If already granted, no need to show popup
    if (Notification.permission === "granted") {
      return;
    }

    // If user denied, don't annoy them - respect their choice
    if (Notification.permission === "denied") {
      return;
    }

    // Check if user recently dismissed the popup
    const dismissedAt = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      if (Date.now() - dismissedTime < NOTIFICATION_PROMPT_DELAY) {
        return; // Don't show again within 24 hours
      }
    }

    // Check if user is logged in (only show to authenticated users)
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      return;
    }

    // Small delay before showing popup for better UX
    const timer = setTimeout(() => {
      setOpen(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const registerNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Request browser permission first
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        toast.error("Notification permission denied");
        setOpen(false);
        return;
      }

      const registration = await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });

      console.log(subscription);
      const res = await fetchWithAuth(
        `${process.env.NEXT_PUBLIC_API_URL}/notifications/subscribe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(subscription),
        }
      );

      if (res.ok) {
        toast.success("Notifications enabled successfully!");
      }
      
      // Clear the dismissed flag since they enabled it
      localStorage.removeItem(NOTIFICATION_PROMPT_KEY);
      setOpen(false);
    } catch (error) {
      console.error("Error enabling notifications:", error);
      toast.error("Failed to enable notifications");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = () => {
    // Remember that user dismissed, don't show again for 24 hours
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, Date.now().toString());
    setOpen(false);
  };

  // Don't render if not open (avoids unnecessary DOM)
  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-2">
            <Bell className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Enable Notifications</DialogTitle>
          <DialogDescription className="text-center">
            Stay updated with your order status, confirmations, and important
            alerts. We&apos;ll only send you relevant notifications.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:flex-col gap-2">
          <Button 
            className="w-full" 
            onClick={registerNotifications}
            disabled={isLoading}
          >
            {isLoading ? "Enabling..." : "Allow Notifications"}
          </Button>
          <Button 
            variant="ghost" 
            className="w-full text-muted-foreground"
            onClick={handleDismiss}
            disabled={isLoading}
          >
            Maybe Later
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
