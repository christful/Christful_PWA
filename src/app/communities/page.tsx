"use client";

import { useState } from "react";
import { DiscoveryCenter } from "@/components/features/communities/DiscoveryCenter";

export default function CommunitiesPage() {
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);

  return (
    <DiscoveryCenter
      showMobileSidebar={showMobileSidebar}
    />
  );
}