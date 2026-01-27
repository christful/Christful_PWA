"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/common/Header";
import { PageGrid } from "@/components/common/PageGrid";
import { SideNav } from "@/components/features/SideNav";
import { CommunityPanel } from "@/components/features/CommunityPanel";
import { Posts } from "@/components/features/Posts";
import { BottomNav } from "@/components/common/BottomNav";
import Splash from "@/components/common/Splash";

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);

  useEffect(() => {
    // Simulate initial check - give splash screen at least 1.5 seconds
    const minTime = setTimeout(() => {
      setIsLoading(false);
    }, 1500);

    return () => clearTimeout(minTime);
  }, []);

  // Show splash screen while loading
  if (isLoading && !dataLoaded) {
    return <Splash />;
  }

  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />
      <PageGrid
        left={<SideNav />}
        center={<Posts onDataLoaded={() => setDataLoaded(true)} />}
        right={<CommunityPanel />}
      />
      <BottomNav />
    </div>
  );
}