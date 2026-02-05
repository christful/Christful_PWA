// components/layout/PageGrid.tsx
import { ReactNode } from "react";

interface PageGridProps {
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
  leftMobileVisibility?: "hidden" | "block";
  centerMobileVisibility?: "hidden" | "block";
}

export function PageGrid({
  left,
  center,
  right,
  leftMobileVisibility = "hidden",
  centerMobileVisibility = "block"
}: PageGridProps) {
  return (
    <div className="pt-20 pb-5 min-h-screen bg-[#F0F2F5]">
      {/* Container with max-width and responsive gap */}
      <div className="max-w-[1600px] mx-auto px-0 sm:px-2 md:px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-[300px_minmax(500px,1fr)] xl:grid-cols-[360px_minmax(600px,1fr)_360px] gap-4">

        {/* Left column */}
        <aside className={`${leftMobileVisibility} lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar`}>
          {left}
        </aside>

        {/* Center column */}
        <main className={`w-full min-w-0 ${centerMobileVisibility} lg:block`}>
          {center}
        </main>

        {/* Right column */}
        <aside className="hidden xl:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
          {right}
        </aside>

      </div>
    </div>
  );
}
