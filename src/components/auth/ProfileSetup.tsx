"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LockIcon, Mail } from "lucide-react";
import Splash from "@/components/common/Splash";
import { useGoogleLogin } from "@react-oauth/google";
import Link from "next/link";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { toast } from "sonner";
import axios from "axios";

import { ENDPOINTS } from "@/lib/api-config";
import { useRouter } from "next/navigation";

export function ProfileSetup() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Hide splash after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Splash />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-60 p-4 w-full max-w-6xl">
        <div className="justify-center items-center flex">
          <Image
            src="/logo.png"
            alt="Christful Logo"
            width={300}
            height={300}
            className="animate-fade-in w-[200px] md:w-[300px]"
          />
        </div>
        <div className="w-full max-w-sm mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-2xl font-bold mb-2">Login</h1>
            <p className="text-muted-foreground">Welcome back to Christful</p>
          </div>
          
        </div>
      </div>
    </div>
  );
}
