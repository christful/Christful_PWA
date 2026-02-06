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

function LoginContent() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.LOGIN, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Login successful!");
        // Store token and user data in localStorage
        if (data.token) {
          localStorage.setItem("auth_token", data.token);
        }
        if (data.user?.id) {
          localStorage.setItem("userId", data.user.id);
        }
        if (data.user?.firstName) {
          localStorage.setItem("userName", data.user.firstName);
        }
        router.push("/home");
      } else {
        toast.error(data.message || "Invalid credentials. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("An error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log("Google Token Response:", tokenResponse);
        const res = await axios.post(ENDPOINTS.GOOGLE_AUTH, {
          access_token: tokenResponse.access_token,
        });
        if (res.data?.token) {
          localStorage.setItem("auth_token", res.data.token);
        }
        if (res.data?.user?.id) {
          localStorage.setItem("userId", res.data.user.id);
        }
        router.push("/home");
      } catch (err) {
        console.error("Google login failed:", err);
        toast.error("Google login failed");
      }
    },
    onError: (error) => {
      console.error("Google login error:", error);
      toast.error("Google login error");
    },
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
          <form onSubmit={handleSubmit}>
            <div className="relative mb-4">
              <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="email"
                id="email"
                placeholder="Enter your email"
                className="pl-10"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="relative mb-6">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={passwordVisible ? "text" : "password"}
                id="password"
                placeholder="Enter your password"
                className="pl-10 pr-10"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-muted-foreground hover:text-foreground"
                aria-label="Toggle password visibility"
              >
                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="mb-4">
              <Button type="submit" className="w-full bg-[#800517] hover:bg-[#800517]/90" disabled={isLoading}>
                {isLoading ? "Logging in..." : "Login"}
              </Button>
            </div>
            <div className="mb-4">
              <Button
                type="button"
                className="w-full bg-white border hover:bg-gray-50 text-foreground flex items-center justify-center gap-2"
                onClick={() => loginWithGoogle()}
                disabled={isLoading}
              >
                <img src="/google_logo.png" alt="google logo" className="h-4 w-4" />
                Continue with Google
              </Button>
            </div>
            <div className="mb-6 text-center border-b border-muted-foreground/30 pb-5">
              <Link href="/auth/reset-password" title="reset password" className="text-sm hover:underline text-blue-600">
                Forgotten password?
              </Link>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-4">Don't have an account?</p>
              <Link href="/auth/signup">
                <Button variant="secondary" className="w-full" disabled={isLoading}>
                  Create an account
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function LoginLayout() {
  const { GoogleOAuthProvider } = require("@react-oauth/google");

  return (
    <GoogleOAuthProvider clientId="363990971536-b57116i98g4m56bm4vri2uqnfqa4bp4j.apps.googleusercontent.com">
      <LoginContent />
    </GoogleOAuthProvider>
  );
}

