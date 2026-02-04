// components/layout/PageGrid.tsx
import { ReactNode } from "react";

interface PageGridProps {
  left?: ReactNode;
  center: ReactNode;
  right?: ReactNode;
}

export function PageGrid({ left, center, right }: PageGridProps) {
  return (
    <div className="pt-20 pb-5 min-h-screen bg-[#F0F2F5]">
      <div className="w-full mx-auto px-0 sm:px-2 md:px-4 lg:px-6 grid grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)_360px] gap-4">

        {/* Left column */}
        <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
          {left}
        </aside>

        {/* Center column */}
        <main className="w-full">
          {center}
        </main>

        {/* Right column */}
        <aside className="hidden lg:block sticky top-24 h-[calc(100vh-6rem)] overflow-y-auto custom-scrollbar">
          {right}
        </aside>

      </div>
    </div>
  );
}
