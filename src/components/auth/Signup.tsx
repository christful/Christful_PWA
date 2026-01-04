"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LockIcon, Mail, UserRound } from "lucide-react";
import Splash from "@/components/common/Splash";
import Link from "next/link";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { toast } from "sonner";

export function SignUpLayout() {
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
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000); // 3000ms = 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (showSplash) {
    // Splash screen UI
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Splash />
      </div>
    );
  }

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
             <div className="text-center mb-20 sm:mb-20">
                <p className="text-base  text-xl mb-5 font-semibold leading-none tracking-tight">
                  Welcome
                </p>
                <p className="text-base text-sm text-medium">
                  Please create a new account to share the gospel <br /> of Christ with others.
                </p>
            </div>
            <div className="relative mb-4">
              <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                id="name"
                placeholder="Enter your full name"
                className="pl-10"
              />
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
            <div className="relative mb-4">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={passwordVisible ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {passwordVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                    <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="relative mb-4">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={passwordVisible ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm password"
                className="pl-10 pr-10"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {passwordVisible ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                    <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mb-4">
                <Button
                onClick={() =>
                toast.success("Action completed successfully!")
            }
                className="w-full">Sign Up</Button>
            </div>
            <div className="mb-">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-foreground">
                <FaGoogle className="h-4 w-4" />
                Continue with google
                </Button>
            </div>
            <div className="mb-4 text-center border-b border-muted-foreground/30 pb-5">
                {/* <Link href="/auth/reset-password" className="text-sm  hover:underline text-center text-blue-600">
                    Forgotten password?
                </Link> */}
            </div>
            <div className="mb-4">
              <Link href="/auth/login">
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-foreground">Login</Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
