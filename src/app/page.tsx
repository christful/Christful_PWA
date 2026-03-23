"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ENDPOINTS } from "@/lib/api-config";

export default function Home() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        router.replace("/auth/login");
        return;
      }

      try {
        const response = await fetch(ENDPOINTS.USER, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          // Token is valid, redirect to home feed
          router.replace("/home");
        } else {
          // Token invalid or expired
          localStorage.removeItem("auth_token");
          toast.error("Session expired. Please login again.");
          router.replace("/auth/login");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        toast.error("Network error. Please try again.");
        router.replace("/auth/login");
      } finally {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [router]);

  if (isChecking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Fallback (should not render)
  return null;
}