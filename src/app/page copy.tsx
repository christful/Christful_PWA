import Image from "next/image";
import { LoginLayout } from "@/components/auth/Login";
import { Header } from "@/components/common/Header";
import { PageGrid } from "@/components/common/PageGrid";
import { SideNav } from "@/components/features/SideNav";
import { CommunityPanel } from "@/components/features/CommunityPanel";
import { Posts } from "@/components/features/Posts";
import { BottomNav } from "@/components/common/BottomNav";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#FBFDFF] pb-20 md:pb-0">
      <Header />
      <PageGrid
        left={<SideNav />}
        center={<Posts />}
        right={<CommunityPanel />}
      />
      <BottomNav />
    </div>
  );
}
