"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LockIcon, Mail } from "lucide-react";
import Splash from "@/components/common/Splash";
import Link from "next/link";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { toast } from "sonner";

export default function ResetPassword() {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(true); // splash state

   const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault(); 
    console.log("Form submitted");
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible(!passwordVisible);
  };

  // Hide splash after 3 seconds
  // useEffect(() => {
  //   const timer = setTimeout(() => {
  //     setShowSplash(false);
  //   }, 3000); // 3000ms = 3 seconds

  //   return () => clearTimeout(timer);
  // }, []);

  // if (showSplash) {
  //   // Splash screen UI
  //   return (
  //     <div className="flex min-h-screen items-center justify-center bg-white">
  //       <Splash />
  //     </div>
  //   );
  // }

  // Main Auth UI
  return (
    <div className="flex min-h-screen items-center justify-center bg-white font-sans">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-60">
        <div className="justify-center items-center flex">
          <Image
            src="/logo.png"
            alt="Christful Logo"
            width={300}
            height={300}
            className="animate-fade-in "
          />
        </div>
        <div>
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-5">
                <p className="text-base  text-xl mb-5 font-semibold leading-none tracking-tight">
                  Forgotten your password
                </p>
                <p className="text-base text-sm text-medium">
                  Enter the email address used to create your account
                </p>
            </div>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                id="email"
                placeholder="Enter your email"
                className="pl-10"
              />
            </div>
            <div className="mb-4">
                <Button
                onClick={() =>
                toast.success("Action completed successfully!")
            }
                className="w-full">Proceed</Button>
            </div>
            <div className="mb-4">
              <Link href="/auth/login">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-foreground">Nevermind, I remembered</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
