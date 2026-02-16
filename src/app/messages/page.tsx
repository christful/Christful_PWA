"use client"
import { Suspense } from "react";
import dynamic from "next/dynamic";

const MessagesContent = dynamic(() => import("./MessagesContent"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800517]"></div>
    </div>
  )
});

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F0F2F5] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800517]"></div>
      </div>
    }>
      <MessagesContent />
    </Suspense>
  );
}
