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
import { ProfileSetup } from "@/components/auth/ProfileSetup";

export default function Auth() {
  
  return (
    <ProfileSetup />
  );
}
