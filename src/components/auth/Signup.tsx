"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LockIcon, Mail, UserRound } from "lucide-react";
import Splash from "@/components/common/Splash";
import Link from "next/link";
import { useGoogleLogin } from "@react-oauth/google";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { toast } from "sonner";

import { ENDPOINTS } from "@/lib/api-config";
import { useRouter } from "next/navigation";

function SignUpContent() {
  const router = useRouter();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(ENDPOINTS.REGISTER, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Account created successfully!");
        router.push("/auth/login");
      } else {
        toast.error(data.message || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("An error occurred. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  const continueWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        console.log("Google Token Response:", tokenResponse);
        const res = await axios.post("https://christful-backend.vercel.app/google-auth", {
          access_token: tokenResponse.access_token,
        });
        if (res.data?.token) localStorage.setItem("auth_token", res.data.token);
        router.push("/profileSetup");
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
          <form onSubmit={handleSubmit}>
            <div className="text-center mb-10">
              <h1 className="text-2xl font-bold mb-2">Welcome</h1>
              <p className="text-muted-foreground">
                Please create a new account to share the gospel <br /> of Christ with others.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  id="firstName"
                  placeholder="First Name"
                  className="pl-10"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <UserRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  id="lastName"
                  placeholder="Last Name"
                  className="pl-10"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={isLoading}
                />
              </div>
            </div>
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
            <div className="relative mb-4">
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
              >
                {passwordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <div className="relative mb-6">
              <LockIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type={passwordVisible ? "text" : "password"}
                id="confirmPassword"
                placeholder="Confirm password"
                className="pl-10 pr-10"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            <div className="mb-4">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Signing up..." : "Sign Up"}
              </Button>
            </div>
            <div className="mb-4 text-center">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-[1px] bg-muted-foreground/20 flex-1"></div>
                <span className="text-xs text-muted-foreground uppercase">or</span>
                <div className="h-[1px] bg-muted-foreground/20 flex-1"></div>
              </div>
              <Button
                type="button"
                className="w-full bg-white border hover:bg-gray-50 text-foreground flex items-center justify-center gap-2"
                onClick={() => continueWithGoogle()}
                disabled={isLoading}
              >
                <img src="/google_logo.png" alt="google logo" className="h-4 w-4" />
                Continue with Google
              </Button>
            </div>
            <div className="text-center mt-6">
              <p className="text-sm text-muted-foreground mb-4">Already have an account?</p>
              <Link href="/auth/login">
                <Button variant="secondary" className="w-full" disabled={isLoading}>
                  Login
                </Button>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export function SignUpLayout() {
  const { GoogleOAuthProvider } = require("@react-oauth/google");

  return (
    <GoogleOAuthProvider clientId="363990971536-b57116i98g4m56bm4vri2uqnfqa4bp4j.apps.googleusercontent.com">
      <SignUpLayout />
    </GoogleOAuthProvider>
  );
}